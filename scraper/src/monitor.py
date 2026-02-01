#!/usr/bin/env python3
"""
Monitor benchmark data sources for changes.
Fetches data from all benchmark sources, computes hashes, and detects changes.
When changes are detected, generates a diff report.
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

console = Console()

# Data sources configuration
DATA_SOURCES = {
    "eva": {
        "name": "EVA Benchmark",
        "url": "https://raw.githubusercontent.com/kaiko-ai/eva/main/tools/data/leaderboards/pathology.csv",
        "type": "csv",
    },
    "pathbench": {
        "name": "PathBench",
        "url": "https://raw.githubusercontent.com/birkhoffkiki/PathBench/master/src/data/performance.json",
        "type": "json",
    },
    "stanford": {
        "name": "Stanford PathBench",
        "url": "https://raw.githubusercontent.com/gevaertlab/benchmarking-path-models/main/data/benchmarking_wci.csv",
        "type": "csv",
    },
    "hest": {
        "name": "HEST Benchmark",
        "url": "https://raw.githubusercontent.com/mahmoodlab/HEST/main/README.md",
        "type": "readme",
        "section": "hest-benchmark-results",
    },
    "pathobench": {
        "name": "Patho-Bench",
        "url": "https://arxiv.org/html/2601.05148",
        "type": "html",
    },
    "sinai": {
        "name": "Sinai SSL Benchmark",
        "url": "https://raw.githubusercontent.com/sinai-computational-pathology/SSL_tile_benchmarks/main/README.md",
        "type": "readme",
        "section": "leaderboard",
    },
    "stamp": {
        "name": "STAMP Benchmark",
        "url": "https://static-content.springer.com/esm/art%3A10.1038%2Fs41551-025-01516-3/MediaObjects/41551_2025_1516_MOESM5_ESM.xlsx",
        "type": "binary",
    },
    "thunder": {
        "name": "THUNDER Benchmark",
        "url": "https://raw.githubusercontent.com/MICS-Lab/thunder/main/docs/leaderboards.md",
        "type": "markdown",
        "section": "up-to-date-rank-sum-leaderboard",
    },
    "pathorob": {
        "name": "PathoROB",
        "url": "https://raw.githubusercontent.com/bifold-pathomics/PathoROB/main/README.md",
        "type": "readme",
        "section": "leaderboard-robustness-index",
    },
    "plism": {
        "name": "Plismbench",
        "url": "https://raw.githubusercontent.com/owkin/plism-benchmark/main/README.md",
        "type": "readme",
        "section": "benchmark",
    },
}

# Storage paths
SCRAPER_DIR = Path(__file__).parent.parent
HASHES_FILE = SCRAPER_DIR / "data" / "source_hashes.json"
SNAPSHOTS_DIR = SCRAPER_DIR / "data" / "snapshots"


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


def extract_section(content: str, section_id: str) -> str:
    """Extract a specific section from markdown content based on header anchor."""
    lines = content.split('\n')
    in_section = False
    section_lines = []
    section_level = 0

    # Normalize section_id: replace hyphens/underscores with spaces, remove other special chars
    section_id_normalized = section_id.lower().replace('-', ' ').replace('_', ' ')
    section_id_normalized = re.sub(r'[^\w\s]', '', section_id_normalized)
    section_id_words = set(section_id_normalized.split())

    for line in lines:
        # Check for headers
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            level = len(header_match.group(1))
            header_text = header_match.group(2).strip()
            # Normalize header text - convert hyphens/underscores to spaces, remove emojis and special chars
            header_normalized = header_text.lower().replace('-', ' ').replace('_', ' ')
            header_normalized = re.sub(r'[^\w\s]', '', header_normalized)
            header_words = set(header_normalized.split())

            # Check if section_id words are mostly contained in header
            # This handles cases like "HEST-Benchmark results (01.14.26)" matching "hest-benchmark-results"
            # And "🏆 Up-to-date Rank-sum Leaderboard" matching "up-to-date-rank-sum-leaderboard"
            common_words = section_id_words & header_words
            match_ratio = len(common_words) / len(section_id_words) if section_id_words else 0

            if match_ratio >= 0.5 or section_id_normalized in header_normalized:
                in_section = True
                section_level = level
                section_lines.append(line)
                continue
            elif in_section and level <= section_level:
                # We've reached another section at the same or higher level
                break

        if in_section:
            section_lines.append(line)

    return '\n'.join(section_lines)


def fetch_content(source_id: str, source_config: dict, client: httpx.Client) -> Optional[str]:
    """Fetch content from a data source."""
    url = source_config["url"]
    source_type = source_config["type"]

    try:
        response = client.get(url, follow_redirects=True, timeout=60.0)
        response.raise_for_status()

        if source_type == "binary":
            # For binary files (Excel), return base64 or just the raw bytes hash
            return response.content.hex()

        content = response.text

        # Extract section if specified
        if source_type in ("readme", "markdown") and "section" in source_config:
            content = extract_section(content, source_config["section"])

        return content

    except Exception as e:
        console.print(f"[red]Error fetching {source_id}: {e}[/red]")
        return None


def compute_hash(content: str) -> str:
    """Compute SHA256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def load_hashes() -> dict[str, str]:
    """Load stored hashes from file."""
    if HASHES_FILE.exists():
        with open(HASHES_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_hashes(hashes: dict[str, str]):
    """Save hashes to file."""
    HASHES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HASHES_FILE, 'w') as f:
        json.dump(hashes, f, indent=2)


def load_snapshot(source_id: str) -> Optional[str]:
    """Load previous snapshot of source content."""
    snapshot_file = SNAPSHOTS_DIR / f"{source_id}.txt"
    if snapshot_file.exists():
        with open(snapshot_file, 'r') as f:
            return f.read()
    return None


def save_snapshot(source_id: str, content: str):
    """Save snapshot of source content."""
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_file = SNAPSHOTS_DIR / f"{source_id}.txt"
    with open(snapshot_file, 'w') as f:
        f.write(content)


def generate_diff(old_content: Optional[str], new_content: str) -> list[str]:
    """Generate unified diff between old and new content."""
    if old_content is None:
        return ["[New source - no previous content]"]

    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)

    diff = list(difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile='previous',
        tofile='current',
        lineterm=''
    ))

    return diff


def generate_report(changes: list[SourceChange]) -> str:
    """Generate a human-readable report of all changes."""
    if not changes:
        return "No changes detected in any benchmark data sources."

    report_lines = [
        "=" * 80,
        "HISTOBOARD BENCHMARK DATA CHANGE REPORT",
        f"Generated: {datetime.now().isoformat()}",
        "=" * 80,
        "",
        f"Changes detected in {len(changes)} benchmark(s):",
        "",
    ]

    for change in changes:
        report_lines.extend([
            "-" * 80,
            f"BENCHMARK: {change.benchmark_name} ({change.benchmark_id})",
            "-" * 80,
            f"Previous hash: {change.old_hash or 'None (new source)'}",
            f"New hash: {change.new_hash}",
            "",
            "DIFF:",
            "",
        ])

        if change.diff_lines:
            # Limit diff output to avoid huge reports
            diff_text = ''.join(change.diff_lines[:500])
            if len(change.diff_lines) > 500:
                diff_text += f"\n... ({len(change.diff_lines) - 500} more lines truncated)"
            report_lines.append(diff_text)
        else:
            report_lines.append("[No textual diff available]")

        report_lines.append("")

    report_lines.extend([
        "=" * 80,
        "END OF REPORT",
        "=" * 80,
    ])

    return '\n'.join(report_lines)


def check_for_changes() -> tuple[list[SourceChange], dict[str, str]]:
    """Check all data sources for changes."""
    changes = []
    new_hashes = {}
    stored_hashes = load_hashes()

    with httpx.Client() as client:
        for source_id, source_config in DATA_SOURCES.items():
            console.print(f"[blue]Checking {source_config['name']}...[/blue]")

            content = fetch_content(source_id, source_config, client)
            if content is None:
                console.print(f"[yellow]  Skipped (fetch failed)[/yellow]")
                # Keep old hash if fetch failed
                if source_id in stored_hashes:
                    new_hashes[source_id] = stored_hashes[source_id]
                continue

            content_hash = compute_hash(content)
            new_hashes[source_id] = content_hash

            old_hash = stored_hashes.get(source_id)

            if old_hash != content_hash:
                console.print(f"[yellow]  CHANGE DETECTED![/yellow]")

                old_content = load_snapshot(source_id)
                diff_lines = generate_diff(old_content, content)

                changes.append(SourceChange(
                    benchmark_id=source_id,
                    benchmark_name=source_config["name"],
                    old_hash=old_hash,
                    new_hash=content_hash,
                    old_content=old_content,
                    new_content=content,
                    diff_lines=diff_lines,
                ))

                # Save new snapshot
                save_snapshot(source_id, content)
            else:
                console.print(f"[green]  No changes[/green]")

    return changes, new_hashes


def main():
    """Main entry point."""
    console.print("[bold]Histoboard Benchmark Monitor[/bold]")
    console.print(f"Checking {len(DATA_SOURCES)} data sources...\n")

    changes, new_hashes = check_for_changes()

    # Save updated hashes
    save_hashes(new_hashes)

    # Generate and print report
    report = generate_report(changes)
    console.print("\n" + report)

    # Save report to file
    report_dir = SCRAPER_DIR / "data" / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_file = report_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, 'w') as f:
        f.write(report)
    console.print(f"\n[green]Report saved to {report_file}[/green]")

    # Return exit code based on whether changes were found
    # This can be used by CI to determine if email should be sent
    if changes:
        console.print(f"\n[yellow]Found changes in {len(changes)} benchmark(s)[/yellow]")
        # Write changes summary for CI
        changes_file = SCRAPER_DIR / "data" / "changes_detected.json"
        with open(changes_file, 'w') as f:
            json.dump({
                "has_changes": True,
                "changed_benchmarks": [c.benchmark_id for c in changes],
                "report_file": str(report_file),
            }, f)
        return 1
    else:
        console.print("\n[green]No changes detected in any benchmark[/green]")
        changes_file = SCRAPER_DIR / "data" / "changes_detected.json"
        with open(changes_file, 'w') as f:
            json.dump({"has_changes": False}, f)
        return 0


if __name__ == "__main__":
    exit(main())
