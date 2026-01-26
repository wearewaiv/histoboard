"""Scraper for EVA benchmark results."""

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapedResult


class EVAScraper(BaseScraper):
    """Scraper for EVA benchmark (kaiko.ai)."""

    name = "eva"
    url = "https://kaiko.ai/benchmarks/eva"

    # Known model name mappings
    MODEL_MAPPING = {
        "uni": "uni",
        "virchow": "virchow",
        "virchow2": "virchow2",
        "gigapath": "gigapath",
        "prov-gigapath": "gigapath",
        "hibou-l": "hibou-l",
        "hibou-b": "hibou-b",
        "phikon": "phikon",
        "phikon-v2": "phikon-v2",
        "ctranspath": "ctranspath",
        "resnet50": "resnet50-imagenet",
        "conch": "conch",
    }

    # Task mapping
    TASK_MAPPING = {
        "bach": "eva-bach",
        "crc-100k": "eva-crc",
        "pcam": "eva-pcam",
        "mhist": "eva-mhist",
        "skin": "eva-skin",
    }

    async def scrape(self) -> list[ScrapedResult]:
        """Scrape EVA benchmark results."""
        # Note: This is a placeholder implementation
        # Actual implementation would parse the EVA website
        # For now, returns empty list as data is in static JSON

        try:
            html = await self.fetch_html(self.url)
            soup = BeautifulSoup(html, "lxml")

            # EVA benchmark structure parsing would go here
            # This is benchmark-specific and would need to be updated
            # based on the actual HTML structure

            results = []
            # Parse tables/data from soup...

            return results

        except Exception as e:
            print(f"Error scraping EVA: {e}")
            return []

    def map_model_name(self, raw_name: str) -> str | None:
        """Map raw model name to standardized ID."""
        normalized = self.normalize_model_name(raw_name)
        return self.MODEL_MAPPING.get(normalized)

    def map_task_name(self, raw_name: str) -> str | None:
        """Map raw task name to standardized ID."""
        normalized = raw_name.strip().lower()
        return self.TASK_MAPPING.get(normalized)
