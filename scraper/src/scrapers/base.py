"""
Base Scraper Module

This module provides the foundational classes for benchmark data collection.
All benchmark-specific scrapers should inherit from BaseScraper and implement
the scrape() method.

Architecture:
- ScrapedResult: Pydantic model representing a single benchmark measurement
- BaseScraper: Abstract base class with common HTTP fetching and normalization

Usage:
    class MyScraper(BaseScraper):
        name = "my-benchmark"
        url = "https://example.com/benchmark"

        async def scrape(self) -> list[ScrapedResult]:
            html = await self.fetch_html(self.url)
            # Parse and return results...
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

import httpx
from pydantic import BaseModel, Field


# =============================================================================
# Data Models
# =============================================================================


class ScrapedResult(BaseModel):
    """
    A single benchmark result representing one model's performance on one task.

    Attributes:
        model_id: Canonical model identifier (e.g., 'virchow2', 'uni')
        task_id: Benchmark-prefixed task identifier (e.g., 'eva-bach', 'pathbench-bracs')
        value: Performance metric value (typically 0-1 for accuracy-based metrics)
        source: Identifier of the benchmark source (e.g., 'eva', 'pathbench')
        retrieved_at: ISO date string when this result was scraped
    """

    model_id: str
    task_id: str
    value: float
    source: str
    retrieved_at: str = Field(default_factory=lambda: datetime.now().isoformat()[:10])


# =============================================================================
# Base Scraper
# =============================================================================


class BaseScraper(ABC):
    """
    Abstract base class for all benchmark scrapers.

    Provides common functionality for HTTP requests, response parsing,
    and model name normalization. Designed to be used as an async context
    manager to ensure proper resource cleanup.

    Class Attributes:
        name: Identifier for this scraper (used in logging and source tracking)
        url: Primary URL to scrape data from

    Instance Attributes:
        client: Async HTTP client for making requests
        results: Collected results from scraping (populated by scrape())

    Example:
        async with MyScraper() as scraper:
            results = await scraper.scrape()
    """

    name: str = "base"
    url: str = ""

    def __init__(self, timeout: float = 30.0) -> None:
        """
        Initialize the scraper with an HTTP client.

        Args:
            timeout: Request timeout in seconds (default: 30)
        """
        self.client = httpx.AsyncClient(timeout=timeout)
        self.results: list[ScrapedResult] = []

    async def __aenter__(self) -> "BaseScraper":
        """Enter async context manager."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Exit async context manager and close HTTP client."""
        await self.client.aclose()

    # -------------------------------------------------------------------------
    # Abstract Methods
    # -------------------------------------------------------------------------

    @abstractmethod
    async def scrape(self) -> list[ScrapedResult]:
        """
        Scrape benchmark results from the source.

        Must be implemented by subclasses. Should fetch data from self.url,
        parse it, and return a list of ScrapedResult objects.

        Returns:
            List of scraped benchmark results
        """
        pass

    # -------------------------------------------------------------------------
    # HTTP Fetching
    # -------------------------------------------------------------------------

    async def fetch_html(self, url: str) -> str:
        """
        Fetch HTML content from a URL.

        Args:
            url: URL to fetch

        Returns:
            HTML content as string

        Raises:
            httpx.HTTPStatusError: If response status is not 2xx
        """
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text

    async def fetch_json(self, url: str) -> Any:
        """
        Fetch and parse JSON content from a URL.

        Args:
            url: URL to fetch

        Returns:
            Parsed JSON data

        Raises:
            httpx.HTTPStatusError: If response status is not 2xx
            json.JSONDecodeError: If response is not valid JSON
        """
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    # -------------------------------------------------------------------------
    # Normalization Utilities
    # -------------------------------------------------------------------------

    def normalize_model_name(self, name: str) -> str:
        """
        Normalize a model name for consistent matching.

        Applies lowercase transformation and replaces spaces with hyphens.
        Subclasses may override for benchmark-specific normalization.

        Args:
            name: Raw model name from the source

        Returns:
            Normalized model name
        """
        return name.strip().lower().replace(" ", "-")
