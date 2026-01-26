"""Export scraped data to JSON format for frontend consumption."""

import json
from pathlib import Path
from typing import Any


class JSONExporter:
    """Export data to JSON files for the frontend."""

    def __init__(self, output_dir: str | Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export(self, data: Any, filename: str, indent: int = 2) -> Path:
        """Export data to a JSON file."""
        output_path = self.output_dir / filename
        with open(output_path, "w") as f:
            json.dump(data, f, indent=indent, default=str)
        return output_path

    def export_models(self, models: list[dict]) -> Path:
        """Export models data."""
        return self.export(models, "models.json")

    def export_benchmarks(self, benchmarks: list[dict]) -> Path:
        """Export benchmarks data."""
        return self.export(benchmarks, "benchmarks.json")

    def export_tasks(self, tasks: list[dict]) -> Path:
        """Export tasks data."""
        return self.export(tasks, "tasks.json")

    def export_results(self, results: list[dict]) -> Path:
        """Export results data."""
        return self.export(results, "results.json")

    def export_all(
        self,
        models: list[dict],
        benchmarks: list[dict],
        tasks: list[dict],
        results: list[dict],
    ) -> dict[str, Path]:
        """Export all data files."""
        return {
            "models": self.export_models(models),
            "benchmarks": self.export_benchmarks(benchmarks),
            "tasks": self.export_tasks(tasks),
            "results": self.export_results(results),
        }
