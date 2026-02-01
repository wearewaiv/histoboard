"""
Normalizers Module

Contains classes for normalizing and mapping data from different sources
to canonical Histoboard identifiers.

Available normalizers:
- ModelMapper: Maps model name variants to canonical IDs
"""

from .model_mapper import ModelMapper, ModelAlias

__all__ = ["ModelMapper", "ModelAlias"]
