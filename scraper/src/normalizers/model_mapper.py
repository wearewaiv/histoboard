"""Model name normalization and mapping."""

from dataclasses import dataclass


@dataclass
class ModelAlias:
    """A model alias with confidence score."""

    canonical_id: str
    confidence: float = 1.0


class ModelMapper:
    """Maps various model name variants to canonical IDs."""

    # Mapping of lowercase variants to canonical model IDs
    ALIASES: dict[str, ModelAlias] = {
        # UNI variants
        "uni": ModelAlias("uni"),
        "uni-mass": ModelAlias("uni"),
        "mahmoodlab/uni": ModelAlias("uni"),

        # Virchow variants
        "virchow": ModelAlias("virchow"),
        "virchow-1": ModelAlias("virchow"),
        "paige/virchow": ModelAlias("virchow"),
        "virchow2": ModelAlias("virchow2"),
        "virchow-2": ModelAlias("virchow2"),
        "paige/virchow2": ModelAlias("virchow2"),

        # GigaPath variants
        "gigapath": ModelAlias("gigapath"),
        "prov-gigapath": ModelAlias("gigapath"),
        "providence-gigapath": ModelAlias("gigapath"),

        # Hibou variants
        "hibou-l": ModelAlias("hibou-l"),
        "hibou-large": ModelAlias("hibou-l"),
        "owkin/hibou-l": ModelAlias("hibou-l"),
        "hibou-b": ModelAlias("hibou-b"),
        "hibou-base": ModelAlias("hibou-b"),

        # Phikon variants
        "phikon": ModelAlias("phikon"),
        "owkin/phikon": ModelAlias("phikon"),
        "phikon-v2": ModelAlias("phikon-v2"),
        "phikonv2": ModelAlias("phikon-v2"),
        "owkin/phikon-v2": ModelAlias("phikon-v2"),

        # CTransPath variants
        "ctranspath": ModelAlias("ctranspath"),
        "ctrans-path": ModelAlias("ctranspath"),
        "c-transpath": ModelAlias("ctranspath"),

        # ResNet baseline
        "resnet50": ModelAlias("resnet50-imagenet"),
        "resnet-50": ModelAlias("resnet50-imagenet"),
        "resnet50-imagenet": ModelAlias("resnet50-imagenet"),
        "imagenet-resnet50": ModelAlias("resnet50-imagenet"),

        # CONCH variants
        "conch": ModelAlias("conch"),
        "mahmoodlab/conch": ModelAlias("conch"),
    }

    @classmethod
    def normalize(cls, name: str) -> str:
        """Normalize a model name string."""
        return name.strip().lower().replace(" ", "-").replace("_", "-")

    @classmethod
    def map(cls, name: str) -> str | None:
        """Map a model name to its canonical ID."""
        normalized = cls.normalize(name)
        alias = cls.ALIASES.get(normalized)
        return alias.canonical_id if alias else None

    @classmethod
    def map_with_confidence(cls, name: str) -> tuple[str | None, float]:
        """Map a model name and return confidence score."""
        normalized = cls.normalize(name)
        alias = cls.ALIASES.get(normalized)
        if alias:
            return alias.canonical_id, alias.confidence
        return None, 0.0

    @classmethod
    def add_alias(cls, alias: str, canonical_id: str, confidence: float = 1.0):
        """Add a new alias mapping."""
        normalized = cls.normalize(alias)
        cls.ALIASES[normalized] = ModelAlias(canonical_id, confidence)
