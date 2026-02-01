"""
Histoboard Scraper - Main Entry Point

This module orchestrates the benchmark scraping process:
1. Runs all registered scrapers to collect benchmark data
2. Displays collected results in a formatted table
3. Exports results to JSON for frontend consumption

Usage:
    python -m src.main

Note:
    Currently the scrapers return empty results as benchmark data is
    maintained in static JSON files. The scraping infrastructure exists
    for future automated data collection.
"""

import asyncio
from pathlib import Path

from rich.console import Console
from rich.table import Table

from .scrapers.base import ScrapedResult
from .scrapers.eva import EVAScraper
from .exporters.json_exporter import JSONExporter


# =============================================================================
# Constants
# =============================================================================

console = Console()

# Output directory for JSON files (relative to scraper package)
FRONTEND_DATA_DIR = Path(__file__).parent.parent.parent / "frontend" / "src" / "data"

# Maximum results to display in the console table
MAX_DISPLAY_RESULTS = 20


# =============================================================================
# Scraper Registry
# =============================================================================

# Add new scrapers here as they are implemented
REGISTERED_SCRAPERS = [
    EVAScraper,
]


# =============================================================================
# Core Functions
# =============================================================================


async def run_scrapers() -> list[ScrapedResult]:
    """
    Run all registered scrapers and collect results.

    Iterates through REGISTERED_SCRAPERS, instantiates each one,
    and collects all results. Errors from individual scrapers are
    caught and logged without stopping the entire process.

    Returns:
        Combined list of results from all scrapers
    """
    all_results: list[ScrapedResult] = []

    for scraper_class in REGISTERED_SCRAPERS:
        scraper = scraper_class()
        console.print(f"[blue]Running {scraper.name} scraper...[/blue]")

        try:
            async with scraper:
                results = await scraper.scrape()
                all_results.extend(results)
                console.print(f"[green]  Found {len(results)} results[/green]")
        except Exception as e:
            console.print(f"[red]  Error: {e}[/red]")

    return all_results


def display_results(results: list[ScrapedResult]) -> None:
    """
    Display scraped results in a formatted console table.

    Shows the first MAX_DISPLAY_RESULTS results with model, task,
    value, and source columns. Indicates if results were truncated.

    Args:
        results: List of scraped results to display
    """
    table = Table(title="Scraped Results")
    table.add_column("Model", style="cyan")
    table.add_column("Task", style="blue")
    table.add_column("Value", justify="right", style="green")
    table.add_column("Source", style="dim")

    for result in results[:MAX_DISPLAY_RESULTS]:
        table.add_row(
            result.model_id,
            result.task_id,
            f"{result.value:.4f}",
            result.source,
        )

    if len(results) > MAX_DISPLAY_RESULTS:
        table.add_row("...", "...", "...", "...")
        table.add_row(f"Total: {len(results)}", "", "", "")

    console.print(table)


async def main() -> None:
    """
    Main entry point for the scraper.

    Orchestrates the scraping workflow:
    1. Print header
    2. Run all scrapers
    3. Display results (if any)
    4. Export to JSON (if any results)
    """
    console.print("[bold]Histoboard Scraper[/bold]")
    console.print()

    # Run all scrapers
    results = await run_scrapers()

    if results:
        display_results(results)

        # Export results to frontend data directory
        exporter = JSONExporter(FRONTEND_DATA_DIR)
        results_dicts = [r.model_dump() for r in results]
        output_path = exporter.export_results(results_dicts)
        console.print(f"\n[green]Results exported to {output_path}[/green]")
    else:
        console.print("\n[yellow]No results scraped. Using existing data.[/yellow]")


# =============================================================================
# Entry Point
# =============================================================================

if __name__ == "__main__":
    asyncio.run(main())
