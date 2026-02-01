"""
JSON Exporter Module

Exports scraped benchmark data to JSON files for frontend consumption.
The exported files are placed in the frontend's data directory and are
imported directly by the Next.js application at build time.

Output files:
- models.json: Model metadata (id, name, organization, etc.)
- benchmarks.json: Benchmark definitions (id, name, tasks, etc.)
- tasks.json: Task definitions (id, name, metric, benchmark, etc.)
- results.json: Performance results (model_id, task_id, value, source)

Usage:
    exporter = JSONExporter("frontend/src/data")
    exporter.export_all(models, benchmarks, tasks, results)
"""

import json
from pathlib import Path
from typing import Any


# =============================================================================
# Type Aliases
# =============================================================================

# Generic dict type for JSON-serializable data
JsonData = dict[str, Any]


# =============================================================================
# JSON Exporter
# =============================================================================


class JSONExporter:
    """
    Exports benchmark data to JSON files for the frontend.

    Creates formatted JSON files in the specified output directory.
    Non-serializable objects (like datetime) are converted to strings.

    Attributes:
        output_dir: Directory where JSON files will be written

    Example:
        exporter = JSONExporter("frontend/src/data")

        # Export individual files
        exporter.export_models(models_data)
        exporter.export_results(results_data)

        # Or export all at once
        paths = exporter.export_all(models, benchmarks, tasks, results)
    """

    def __init__(self, output_dir: str | Path) -> None:
        """
        Initialize the exporter with an output directory.

        Creates the directory if it doesn't exist.

        Args:
            output_dir: Path to the output directory
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export(self, data: Any, filename: str, indent: int = 2) -> Path:
        """
        Export data to a JSON file.

        Args:
            data: JSON-serializable data to export
            filename: Name of the output file (e.g., 'models.json')
            indent: JSON indentation level (default: 2 spaces)

        Returns:
            Path to the created file
        """
        output_path = self.output_dir / filename
        with open(output_path, "w") as f:
            json.dump(data, f, indent=indent, default=str)
        return output_path

    # -------------------------------------------------------------------------
    # Typed Export Methods
    # -------------------------------------------------------------------------

    def export_models(self, models: list[JsonData]) -> Path:
        """Export models data to models.json."""
        return self.export(models, "models.json")

    def export_benchmarks(self, benchmarks: list[JsonData]) -> Path:
        """Export benchmarks data to benchmarks.json."""
        return self.export(benchmarks, "benchmarks.json")

    def export_tasks(self, tasks: list[JsonData]) -> Path:
        """Export tasks data to tasks.json."""
        return self.export(tasks, "tasks.json")

    def export_results(self, results: list[JsonData]) -> Path:
        """Export results data to results.json."""
        return self.export(results, "results.json")

    def export_all(
        self,
        models: list[JsonData],
        benchmarks: list[JsonData],
        tasks: list[JsonData],
        results: list[JsonData],
    ) -> dict[str, Path]:
        """
        Export all data files at once.

        Convenience method for exporting the complete dataset.

        Args:
            models: Model metadata list
            benchmarks: Benchmark definitions list
            tasks: Task definitions list
            results: Performance results list

        Returns:
            Dictionary mapping data type to output file path
        """
        return {
            "models": self.export_models(models),
            "benchmarks": self.export_benchmarks(benchmarks),
            "tasks": self.export_tasks(tasks),
            "results": self.export_results(results),
        }
