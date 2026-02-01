"""
Model Name Normalization and Mapping

This module handles the mapping of various model name variants to canonical IDs.
Different benchmarks and papers use different naming conventions for the same model,
so this mapper provides a centralized way to normalize names.

Example variations that map to 'virchow2':
- "Virchow2", "virchow-2", "VIRCHOW-2", "paige/virchow2"

Usage:
    from normalizers.model_mapper import ModelMapper

    canonical_id = ModelMapper.map("paige/virchow2")  # Returns "virchow2"
    canonical_id, confidence = ModelMapper.map_with_confidence("uni-mass")
"""

from dataclasses import dataclass


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class ModelAlias:
    """
    Represents an alias mapping to a canonical model ID.

    Attributes:
        canonical_id: The standardized model identifier
        confidence: Mapping confidence (1.0 = exact match, <1.0 = fuzzy/uncertain)
    """

    canonical_id: str
    confidence: float = 1.0


# =============================================================================
# Alias Definitions
# =============================================================================

# Organized by model family for easier maintenance
# Each entry maps a normalized variant to its canonical ID

_UNI_ALIASES = {
    "uni": ModelAlias("uni"),
    "uni-mass": ModelAlias("uni"),
    "mahmoodlab/uni": ModelAlias("uni"),
}

_VIRCHOW_ALIASES = {
    "virchow": ModelAlias("virchow"),
    "virchow-1": ModelAlias("virchow"),
    "paige/virchow": ModelAlias("virchow"),
    "virchow2": ModelAlias("virchow2"),
    "virchow-2": ModelAlias("virchow2"),
    "paige/virchow2": ModelAlias("virchow2"),
}

_GIGAPATH_ALIASES = {
    "gigapath": ModelAlias("gigapath"),
    "prov-gigapath": ModelAlias("gigapath"),
    "providence-gigapath": ModelAlias("gigapath"),
}

_HIBOU_ALIASES = {
    "hibou-l": ModelAlias("hibou-l"),
    "hibou-large": ModelAlias("hibou-l"),
    "owkin/hibou-l": ModelAlias("hibou-l"),
    "hibou-b": ModelAlias("hibou-b"),
    "hibou-base": ModelAlias("hibou-b"),
}

_PHIKON_ALIASES = {
    "phikon": ModelAlias("phikon"),
    "owkin/phikon": ModelAlias("phikon"),
    "phikon-v2": ModelAlias("phikon-v2"),
    "phikonv2": ModelAlias("phikon-v2"),
    "owkin/phikon-v2": ModelAlias("phikon-v2"),
}

_CTRANSPATH_ALIASES = {
    "ctranspath": ModelAlias("ctranspath"),
    "ctrans-path": ModelAlias("ctranspath"),
    "c-transpath": ModelAlias("ctranspath"),
}

_RESNET_ALIASES = {
    "resnet50": ModelAlias("resnet50-imagenet"),
    "resnet-50": ModelAlias("resnet50-imagenet"),
    "resnet50-imagenet": ModelAlias("resnet50-imagenet"),
    "imagenet-resnet50": ModelAlias("resnet50-imagenet"),
}

_CONCH_ALIASES = {
    "conch": ModelAlias("conch"),
    "mahmoodlab/conch": ModelAlias("conch"),
}


# =============================================================================
# Model Mapper
# =============================================================================


class ModelMapper:
    """
    Maps various model name variants to canonical Histoboard model IDs.

    This class provides static methods for normalizing and mapping model names
    from different sources (papers, benchmarks, repositories) to a single
    canonical identifier used throughout Histoboard.

    The alias database is organized by model family and can be extended at
    runtime using add_alias().

    Example:
        # Basic mapping
        model_id = ModelMapper.map("paige/virchow2")  # Returns "virchow2"

        # With confidence score
        model_id, conf = ModelMapper.map_with_confidence("uni-mass")

        # Add custom alias
        ModelMapper.add_alias("my-model-variant", "canonical-id")
    """

    # Combined alias mapping from all model families
    ALIASES: dict[str, ModelAlias] = {
        **_UNI_ALIASES,
        **_VIRCHOW_ALIASES,
        **_GIGAPATH_ALIASES,
        **_HIBOU_ALIASES,
        **_PHIKON_ALIASES,
        **_CTRANSPATH_ALIASES,
        **_RESNET_ALIASES,
        **_CONCH_ALIASES,
    }

    @classmethod
    def normalize(cls, name: str) -> str:
        """
        Normalize a model name string for consistent matching.

        Applies: lowercase, strip whitespace, replace spaces/underscores with hyphens.

        Args:
            name: Raw model name

        Returns:
            Normalized name suitable for alias lookup
        """
        return name.strip().lower().replace(" ", "-").replace("_", "-")

    @classmethod
    def map(cls, name: str) -> str | None:
        """
        Map a model name to its canonical ID.

        Args:
            name: Raw model name from any source

        Returns:
            Canonical model ID, or None if no mapping exists
        """
        normalized = cls.normalize(name)
        alias = cls.ALIASES.get(normalized)
        return alias.canonical_id if alias else None

    @classmethod
    def map_with_confidence(cls, name: str) -> tuple[str | None, float]:
        """
        Map a model name and return the mapping confidence.

        Useful when you need to know how certain the mapping is,
        for example when dealing with fuzzy or partial matches.

        Args:
            name: Raw model name from any source

        Returns:
            Tuple of (canonical_id, confidence). Returns (None, 0.0) if no mapping.
        """
        normalized = cls.normalize(name)
        alias = cls.ALIASES.get(normalized)
        if alias:
            return alias.canonical_id, alias.confidence
        return None, 0.0

    @classmethod
    def add_alias(cls, alias: str, canonical_id: str, confidence: float = 1.0) -> None:
        """
        Add a new alias mapping at runtime.

        Args:
            alias: The variant name to map from
            canonical_id: The canonical ID to map to
            confidence: Mapping confidence (default: 1.0)
        """
        normalized = cls.normalize(alias)
        cls.ALIASES[normalized] = ModelAlias(canonical_id, confidence)
