"""Main entry point for the scraper."""

import asyncio
from pathlib import Path

from rich.console import Console
from rich.table import Table

from .scrapers.eva import EVAScraper
from .exporters.json_exporter import JSONExporter

console = Console()

# Output directory for JSON files
FRONTEND_DATA_DIR = Path(__file__).parent.parent.parent / "frontend" / "src" / "data"


async def run_scrapers():
    """Run all scrapers and collect results."""
    all_results = []

    scrapers = [
        EVAScraper(),
    ]

    for scraper in scrapers:
        console.print(f"[blue]Running {scraper.name} scraper...[/blue]")
        try:
            async with scraper:
                results = await scraper.scrape()
                all_results.extend(results)
                console.print(f"[green]  Found {len(results)} results[/green]")
        except Exception as e:
            console.print(f"[red]  Error: {e}[/red]")

    return all_results


def display_results(results):
    """Display results in a table."""
    table = Table(title="Scraped Results")
    table.add_column("Model")
    table.add_column("Task")
    table.add_column("Value")
    table.add_column("Source")

    for result in results[:20]:  # Show first 20
        table.add_row(
            result.model_id,
            result.task_id,
            f"{result.value:.4f}",
            result.source,
        )

    if len(results) > 20:
        table.add_row("...", "...", "...", "...")
        table.add_row(f"Total: {len(results)}", "", "", "")

    console.print(table)


async def main():
    """Main entry point."""
    console.print("[bold]Histoboard Scraper[/bold]")
    console.print()

    # Run scrapers
    results = await run_scrapers()

    if results:
        display_results(results)

        # Export results
        exporter = JSONExporter(FRONTEND_DATA_DIR)
        results_dicts = [r.model_dump() for r in results]
        output_path = exporter.export_results(results_dicts)
        console.print(f"\n[green]Results exported to {output_path}[/green]")
    else:
        console.print("\n[yellow]No results scraped. Using existing data.[/yellow]")


if __name__ == "__main__":
    asyncio.run(main())
