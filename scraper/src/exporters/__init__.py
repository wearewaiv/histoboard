"""
Exporters Module

Contains classes for exporting scraped data to various formats.

Available exporters:
- JSONExporter: Exports data to JSON files for frontend consumption
"""

from .json_exporter import JSONExporter

__all__ = ["JSONExporter"]
