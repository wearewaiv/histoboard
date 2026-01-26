"""Base scraper class for benchmark data collection."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

import httpx
from pydantic import BaseModel


class ScrapedResult(BaseModel):
    """A single benchmark result."""

    model_id: str
    task_id: str
    value: float
    source: str
    retrieved_at: str = datetime.now().isoformat()[:10]


class BaseScraper(ABC):
    """Base class for all benchmark scrapers."""

    name: str = "base"
    url: str = ""

    def __init__(self, timeout: float = 30.0):
        self.client = httpx.AsyncClient(timeout=timeout)
        self.results: list[ScrapedResult] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    @abstractmethod
    async def scrape(self) -> list[ScrapedResult]:
        """Scrape benchmark results from the source."""
        pass

    async def fetch_html(self, url: str) -> str:
        """Fetch HTML content from URL."""
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text

    async def fetch_json(self, url: str) -> Any:
        """Fetch JSON content from URL."""
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    def normalize_model_name(self, name: str) -> str:
        """Normalize model name for consistent matching."""
        # Basic normalization - can be extended
        return name.strip().lower().replace(" ", "-")
