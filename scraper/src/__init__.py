"""
Histoboard Scraper Package

A data collection system for aggregating benchmark results from various
pathology foundation model evaluations.

Modules:
- scrapers: Benchmark-specific data collection classes
- normalizers: Model/task name normalization utilities
- exporters: Data export to JSON/other formats
- config: Data source configuration for monitoring
- monitor: Change detection for benchmark data sources

Usage:
    # Run scraper
    python -m src.main

    # Run monitor
    python -m src.monitor
"""
