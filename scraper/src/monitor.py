#!/usr/bin/env python3
"""
Benchmark Data Source Monitor

This module monitors benchmark data sources for changes by:
1. Fetching current content from each source
2. Computing SHA256 hashes to detect changes
3. Generating diff reports when changes are detected
4. Saving snapshots for future comparison

The monitor is designed to run as a scheduled CI job (weekly) and
can send notifications when changes are detected.

Exit codes:
- 0: No changes detected
- 1: Changes detected in one or more sources

Usage:
    python -m src.monitor
"""

import hashlib
import json
import difflib
import re
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

import httpx
from rich.console import Console

from .config import DATA_SOURCES, DataSource

# =============================================================================
# Constants
# =============================================================================

console = Console()

# Directory paths relative to the scraper package
SCRAPER_DIR = Path(__file__).parent.parent
DATA_DIR = SCRAPER_DIR / "data"
HASHES_FILE = DATA_DIR / "source_hashes.json"
SNAPSHOTS_DIR = DATA_DIR / "snapshots"
REPORTS_DIR = DATA_DIR / "reports"
CHANGES_FILE = DATA_DIR / "changes_detected.json"

# Report formatting
SEPARATOR_MAJOR = "=" * 80
SEPARATOR_MINOR = "-" * 80
MAX_DIFF_LINES = 500


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class SourceChange:
    """Represents a detected change in a data source."""

    benchmark_id: str
    benchmark_name: str
    old_hash: Optional[str]
    new_hash: str
    old_content: Optional[str]
    new_content: str
    diff_lines: list[str] = field(default_factory=list)


# =============================================================================
# Content Extraction
# =============================================================================


def normalize_for_matching(text: str) -> tuple[str, set[str]]:
    """
    Normalize text for fuzzy matching.

    Converts hyphens/underscores to spaces, removes special characters,
    and returns both the normalized string and the set of words.

    Args:
        text: The text to normalize

    Returns:
        Tuple of (normalized string, set of words)
    """
    normalized = text.lower().replace("-", " ").replace("_", " ")
    normalized = re.sub(r"[^\w\s]", "", normalized)
    words = set(normalized.split())
    return normalized, words


def extract_section(content: str, section_id: str) -> str:
    """
    Extract a specific section from markdown content.

    Uses fuzzy matching to find the section header, handling variations
    like emojis, dates, and different capitalization.

    Args:
        content: Full markdown content
        section_id: Section anchor to find (e.g., 'hest-benchmark-results')

    Returns:
        Extracted section content, or empty string if not found

    Examples:
        - "hest-benchmark-results" matches "## HEST-Benchmark results (01.14.26)"
        - "up-to-date-rank-sum-leaderboard" matches "## 🏆 Up-to-date Rank-sum Leaderboard"
    """
    lines = content.split("\n")
    section_normalized, section_words = normalize_for_matching(section_id)

    in_section = False
    section_lines: list[str] = []
    section_level = 0

    for line in lines:
        # Check for markdown headers (# to ######)
        header_match = re.match(r"^(#{1,6})\s+(.+)$", line)

        if header_match:
            level = len(header_match.group(1))
            header_text = header_match.group(2).strip()
            header_normalized, header_words = normalize_for_matching(header_text)

            # Compute word overlap ratio for fuzzy matching
            common_words = section_words & header_words
            match_ratio = len(common_words) / len(section_words) if section_words else 0

            # Match if 50%+ word overlap OR exact substring match
            if match_ratio >= 0.5 or section_normalized in header_normalized:
                in_section = True
                section_level = level
                section_lines.append(line)
                continue
            elif in_section and level <= section_level:
                # Reached another section at same or higher level
                break

        if in_section:
            section_lines.append(line)

    return "\n".join(section_lines)


# =============================================================================
# Content Fetching
# =============================================================================


def fetch_content(source: DataSource, client: httpx.Client) -> Optional[str]:
    """
    Fetch content from a data source.

    Handles different source types:
    - csv/json/html: Return raw text content
    - readme/markdown: Extract specific section if configured
    - binary: Return hex-encoded content for hashing

    Args:
        source: Data source configuration
        client: HTTP client for making requests

    Returns:
        Content string, or None if fetch failed
    """
    try:
        response = client.get(source.url, follow_redirects=True, timeout=60.0)
        response.raise_for_status()

        if source.type == "binary":
            # For binary files, return hex representation for hashing
            return response.content.hex()

        content = response.text

        # Extract section for markdown-based sources
        if source.type in ("readme", "markdown") and source.section:
            content = extract_section(content, source.section)

        return content

    except Exception as e:
        console.print(f"[red]Error fetching {source.id}: {e}[/red]")
        return None


# =============================================================================
# Hash Management
# =============================================================================


def compute_hash(content: str) -> str:
    """Compute SHA256 hash of content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def load_hashes() -> dict[str, str]:
    """Load stored hashes from file."""
    if HASHES_FILE.exists():
        with open(HASHES_FILE, "r") as f:
            return json.load(f)
    return {}


def save_hashes(hashes: dict[str, str]) -> None:
    """Save hashes to file."""
    HASHES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HASHES_FILE, "w") as f:
        json.dump(hashes, f, indent=2)


# =============================================================================
# Snapshot Management
# =============================================================================


def load_snapshot(source_id: str) -> Optional[str]:
    """Load previous snapshot of source content."""
    snapshot_file = SNAPSHOTS_DIR / f"{source_id}.txt"
    if snapshot_file.exists():
        with open(snapshot_file, "r") as f:
            return f.read()
    return None


def save_snapshot(source_id: str, content: str) -> None:
    """Save snapshot of source content."""
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_file = SNAPSHOTS_DIR / f"{source_id}.txt"
    with open(snapshot_file, "w") as f:
        f.write(content)


# =============================================================================
# Diff Generation
# =============================================================================


def generate_diff(old_content: Optional[str], new_content: str) -> list[str]:
    """
    Generate unified diff between old and new content.

    Args:
        old_content: Previous content (None for new sources)
        new_content: Current content

    Returns:
        List of diff lines
    """
    if old_content is None:
        return ["[New source - no previous content]"]

    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)

    diff = list(
        difflib.unified_diff(
            old_lines, new_lines, fromfile="previous", tofile="current", lineterm=""
        )
    )

    return diff


# =============================================================================
# Report Generation
# =============================================================================


def generate_report(changes: list[SourceChange]) -> str:
    """
    Generate a human-readable report of all detected changes.

    Args:
        changes: List of detected changes

    Returns:
        Formatted report string
    """
    if not changes:
        return "No changes detected in any benchmark data sources."

    timestamp = datetime.now().isoformat()
    lines = [
        SEPARATOR_MAJOR,
        "HISTOBOARD BENCHMARK DATA CHANGE REPORT",
        f"Generated: {timestamp}",
        SEPARATOR_MAJOR,
        "",
        f"Changes detected in {len(changes)} benchmark(s):",
        "",
    ]

    for change in changes:
        lines.extend(
            [
                SEPARATOR_MINOR,
                f"BENCHMARK: {change.benchmark_name} ({change.benchmark_id})",
                SEPARATOR_MINOR,
                f"Previous hash: {change.old_hash or 'None (new source)'}",
                f"New hash: {change.new_hash}",
                "",
                "DIFF:",
                "",
            ]
        )

        if change.diff_lines:
            diff_text = "".join(change.diff_lines[:MAX_DIFF_LINES])
            if len(change.diff_lines) > MAX_DIFF_LINES:
                truncated = len(change.diff_lines) - MAX_DIFF_LINES
                diff_text += f"\n... ({truncated} more lines truncated)"
            lines.append(diff_text)
        else:
            lines.append("[No textual diff available]")

        lines.append("")

    lines.extend([SEPARATOR_MAJOR, "END OF REPORT", SEPARATOR_MAJOR])

    return "\n".join(lines)


def save_report(report: str) -> Path:
    """
    Save report to a timestamped file.

    Args:
        report: Report content

    Returns:
        Path to the saved report file
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = REPORTS_DIR / f"report_{timestamp}.txt"
    with open(report_file, "w") as f:
        f.write(report)
    return report_file


def save_changes_summary(changes: list[SourceChange], report_file: Path) -> None:
    """
    Save a JSON summary of changes for CI consumption.

    Args:
        changes: List of detected changes
        report_file: Path to the detailed report
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if changes:
        summary = {
            "has_changes": True,
            "changed_benchmarks": [c.benchmark_id for c in changes],
            "report_file": str(report_file),
        }
    else:
        summary = {"has_changes": False}

    with open(CHANGES_FILE, "w") as f:
        json.dump(summary, f)


# =============================================================================
# Main Logic
# =============================================================================


def check_for_changes() -> tuple[list[SourceChange], dict[str, str]]:
    """
    Check all data sources for changes.

    Returns:
        Tuple of (list of changes, updated hash dictionary)
    """
    changes: list[SourceChange] = []
    new_hashes: dict[str, str] = {}
    stored_hashes = load_hashes()

    with httpx.Client() as client:
        for source in DATA_SOURCES:
            console.print(f"[blue]Checking {source.name}...[/blue]")

            content = fetch_content(source, client)

            if content is None:
                console.print("[yellow]  Skipped (fetch failed)[/yellow]")
                # Preserve old hash if fetch failed
                if source.id in stored_hashes:
                    new_hashes[source.id] = stored_hashes[source.id]
                continue

            content_hash = compute_hash(content)
            new_hashes[source.id] = content_hash
            old_hash = stored_hashes.get(source.id)

            if old_hash != content_hash:
                console.print("[yellow]  CHANGE DETECTED![/yellow]")

                old_content = load_snapshot(source.id)
                diff_lines = generate_diff(old_content, content)

                changes.append(
                    SourceChange(
                        benchmark_id=source.id,
                        benchmark_name=source.name,
                        old_hash=old_hash,
                        new_hash=content_hash,
                        old_content=old_content,
                        new_content=content,
                        diff_lines=diff_lines,
                    )
                )

                # Save new snapshot for future comparisons
                save_snapshot(source.id, content)
            else:
                console.print("[green]  No changes[/green]")

    return changes, new_hashes


def main() -> int:
    """
    Main entry point for the benchmark monitor.

    Returns:
        Exit code (0 = no changes, 1 = changes detected)
    """
    console.print("[bold]Histoboard Benchmark Monitor[/bold]")
    console.print(f"Checking {len(DATA_SOURCES)} data sources...\n")

    # Check all sources for changes
    changes, new_hashes = check_for_changes()

    # Save updated hashes
    save_hashes(new_hashes)

    # Generate and display report
    report = generate_report(changes)
    console.print("\n" + report)

    # Save report to file
    report_file = save_report(report)
    console.print(f"\n[green]Report saved to {report_file}[/green]")

    # Save changes summary for CI
    save_changes_summary(changes, report_file)

    # Return appropriate exit code
    if changes:
        console.print(f"\n[yellow]Found changes in {len(changes)} benchmark(s)[/yellow]")
        return 1
    else:
        console.print("\n[green]No changes detected in any benchmark[/green]")
        return 0


if __name__ == "__main__":
    exit(main())
