"""
EVA Benchmark Scraper

Scrapes benchmark results from the EVA evaluation framework by kaiko.ai.
EVA provides tile-level classification benchmarks for pathology foundation models.

Source: https://kaiko.ai/benchmarks/eva
GitHub: https://github.com/kaiko-ai/eva

Note: This scraper is currently a placeholder. The actual benchmark data is
maintained in static JSON files from the EVA GitHub repository CSV exports.
"""

from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapedResult


# =============================================================================
# Constants
# =============================================================================

# Maps raw model names from EVA to canonical Histoboard model IDs
MODEL_NAME_MAPPING: dict[str, str] = {
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

# Maps EVA task names to Histoboard task IDs (prefixed with 'eva-')
TASK_NAME_MAPPING: dict[str, str] = {
    "bach": "eva-bach",
    "crc-100k": "eva-crc",
    "pcam": "eva-pcam",
    "mhist": "eva-mhist",
    "skin": "eva-skin",
}


# =============================================================================
# Scraper Implementation
# =============================================================================


class EVAScraper(BaseScraper):
    """
    Scraper for the EVA benchmark from kaiko.ai.

    EVA evaluates pathology foundation models on tile-level classification
    tasks across multiple datasets (BACH, CRC-100K, PCam, MHIST, etc.).

    Attributes:
        name: Scraper identifier ('eva')
        url: Primary URL for the EVA benchmark page

    Note:
        Currently returns empty results as data is sourced from static files.
        Future implementation would parse the live kaiko.ai benchmark page.
    """

    name = "eva"
    url = "https://kaiko.ai/benchmarks/eva"

    async def scrape(self) -> list[ScrapedResult]:
        """
        Scrape EVA benchmark results from kaiko.ai.

        Note: This is a placeholder implementation. The actual benchmark
        data is maintained in static JSON files from EVA's GitHub repository.
        This method could be extended to parse live results when needed.

        Returns:
            List of scraped results (currently empty)
        """
        try:
            html = await self.fetch_html(self.url)
            soup = BeautifulSoup(html, "lxml")

            # TODO: Implement actual HTML parsing when live scraping is needed
            # The EVA benchmark page structure would need to be analyzed and
            # appropriate selectors defined for extracting model performance data
            _ = soup  # Suppress unused variable warning

            results: list[ScrapedResult] = []
            return results

        except Exception as e:
            # Log error but don't crash - allows fallback to static data
            print(f"Error scraping EVA: {e}")
            return []

    def map_model_name(self, raw_name: str) -> str | None:
        """
        Map a raw model name from EVA to a canonical Histoboard model ID.

        Args:
            raw_name: Model name as it appears in EVA data

        Returns:
            Canonical model ID, or None if no mapping exists
        """
        normalized = self.normalize_model_name(raw_name)
        return MODEL_NAME_MAPPING.get(normalized)

    def map_task_name(self, raw_name: str) -> str | None:
        """
        Map a raw task name from EVA to a Histoboard task ID.

        Args:
            raw_name: Task name as it appears in EVA data

        Returns:
            Prefixed task ID (e.g., 'eva-bach'), or None if no mapping exists
        """
        normalized = raw_name.strip().lower()
        return TASK_NAME_MAPPING.get(normalized)
