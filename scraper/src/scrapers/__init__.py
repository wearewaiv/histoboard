"""
Scrapers Module

Contains benchmark-specific scrapers for collecting performance data.
All scrapers inherit from BaseScraper and implement the scrape() method.

Available scrapers:
- EVAScraper: Scrapes EVA benchmark results from kaiko.ai
"""

from .base import BaseScraper, ScrapedResult
from .eva import EVAScraper

__all__ = ["BaseScraper", "ScrapedResult", "EVAScraper"]
