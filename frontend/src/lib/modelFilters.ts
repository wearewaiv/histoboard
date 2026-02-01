/**
 * Model Filtering Utilities
 *
 * This module provides utilities for filtering and categorizing machine learning models
 * based on their attributes like size (number of parameters), training data,
 * training method, license type, etc.
 *
 * ## What This Module Does
 *
 * When displaying models on the leaderboard, users want to filter them by various
 * criteria (e.g., "show only models smaller than 100M parameters" or "show only
 * open-source models"). This module provides:
 *
 * 1. **Category Definitions** - Pre-defined buckets for model sizes, data sizes, etc.
 * 2. **Parsing Functions** - Convert strings like "632M" or "1.3B" to numbers
 * 3. **Categorization Functions** - Determine which bucket a model falls into
 * 4. **Label Functions** - Get human-readable labels for display in the UI
 *
 * ## Key Concepts
 *
 * - **Parameters (params)**: The number of trainable weights in a neural network,
 *   typically expressed as "307M" (307 million) or "1.3B" (1.3 billion).
 *
 * - **WSI (Whole Slide Image)**: High-resolution scans of tissue samples used in
 *   digital pathology. Models may be trained on thousands to millions of WSIs.
 *
 * - **VLM (Vision-Language Model)**: A model that can process both images and text,
 *   as opposed to a pure vision model (VM) that only processes images.
 *
 * ## Usage Example
 *
 * ```typescript
 * import { getSizeCategory, parseParamSize, isVLMModel } from "@/lib/modelFilters";
 *
 * // Determine which size bucket a model belongs to
 * const sizeCategory = getSizeCategory("307M");  // Returns "100-500"
 *
 * // Parse a size string to a number (in millions)
 * const sizeInMillions = parseParamSize("1.3B"); // Returns 1300
 *
 * // Check if a model is a vision-language model
 * const isVLM = isVLMModel(myModel); // Returns true or false
 * ```
 *
 * @module lib/modelFilters
 */

import type { Model } from "@/types";

// =============================================================================
// Size Parsing and Categories
// =============================================================================

/**
 * Model size categories with min/max bounds (in millions of parameters).
 */
export const SIZE_CATEGORIES = [
  { id: "below-50", label: "< 50M", min: 0, max: 50 },
  { id: "50-100", label: "50M - 100M", min: 50, max: 100 },
  { id: "100-500", label: "100M - 500M", min: 100, max: 500 },
  { id: "500-1000", label: "500M - 1B", min: 500, max: 1000 },
  { id: "above-1000", label: "> 1B", min: 1000, max: Infinity },
] as const;

export type SizeCategoryId = (typeof SIZE_CATEGORIES)[number]["id"];

/**
 * Parse a parameter size string to numeric value (in millions).
 *
 * @example
 * parseParamSize("632M")  // 632
 * parseParamSize("1.3B")  // 1300
 * parseParamSize("307M")  // 307
 */
export function parseParamSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|M|K)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "B") return num * 1000;
  if (unit === "K") return num / 1000;
  return num; // M or no unit
}

/**
 * Get the size category ID for a given params string.
 */
export function getSizeCategory(params: string): SizeCategoryId {
  const sizeInM = parseParamSize(params);
  for (const cat of SIZE_CATEGORIES) {
    if (sizeInM >= cat.min && sizeInM < cat.max) {
      return cat.id;
    }
  }
  return SIZE_CATEGORIES[SIZE_CATEGORIES.length - 1].id;
}

/**
 * Get the label for a size category ID.
 */
export function getSizeCategoryLabel(catId: string): string {
  return SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
}

// =============================================================================
// Pretraining Data Categories
// =============================================================================

/**
 * WSI (Whole Slide Image) data size categories (in thousands).
 */
export const DATA_SIZE_CATEGORIES = [
  { id: "below-10k", label: "< 10K WSIs", min: 0, max: 10 },
  { id: "10k-50k", label: "10K - 50K WSIs", min: 10, max: 50 },
  { id: "50k-100k", label: "50K - 100K WSIs", min: 50, max: 100 },
  { id: "100k-500k", label: "100K - 500K WSIs", min: 100, max: 500 },
  { id: "500k-1m", label: "500K - 1M WSIs", min: 500, max: 1000 },
  { id: "1m-2m", label: "1M - 2M WSIs", min: 1000, max: 2000 },
  { id: "2m-3m", label: "2M - 3M WSIs", min: 2000, max: 3000 },
  { id: "above-3m", label: "> 3M WSIs", min: 3000, max: Infinity },
] as const;

/**
 * Image-caption pair categories (in thousands).
 */
export const IMAGE_CAPTION_CATEGORIES = [
  { id: "ic-below-1m", label: "< 1M image-caption pairs", min: 0, max: 1000 },
  { id: "ic-1m-2m", label: "1M - 2M image-caption pairs", min: 1000, max: 2000 },
  { id: "ic-above-2m", label: "> 2M image-caption pairs", min: 2000, max: Infinity },
] as const;

/**
 * Special category for histology patches.
 */
export const HISTOLOGY_PATCH_CATEGORY = {
  id: "histology-patches",
  label: "50M+ histology patches",
} as const;

/**
 * Parse a pretraining data size string to numeric value (in thousands).
 *
 * @example
 * parseDataSize("3M+ WSIs")   // 3000
 * parseDataSize("100K+ WSIs") // 100
 */
export function parseDataSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(M|K)?\+?\s*/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "M") return num * 1000;
  return num; // K or no unit
}

/**
 * Check if pretraining data mentions WSIs.
 */
export function isWSIData(data: string): boolean {
  return data.toLowerCase().includes("wsi");
}

/**
 * Check if pretraining data mentions image-caption/text pairs.
 */
export function isImageCaptionData(data: string): boolean {
  const lower = data.toLowerCase();
  return (
    lower.includes("image-caption") ||
    lower.includes("image-text") ||
    lower.includes("caption group")
  );
}

/**
 * Check if pretraining data mentions histology patches.
 */
export function isHistologyPatchData(data: string): boolean {
  const lower = data.toLowerCase();
  return lower.includes("images") && !isImageCaptionData(data);
}

/**
 * Get the data size category for a given pretrainingData string.
 *
 * @returns Category ID, or null if not categorizable
 */
export function getDataSizeCategory(data: string): string | null {
  if (isWSIData(data)) {
    const sizeInK = parseDataSize(data);
    for (const cat of DATA_SIZE_CATEGORIES) {
      if (sizeInK >= cat.min && sizeInK < cat.max) {
        return cat.id;
      }
    }
    return DATA_SIZE_CATEGORIES[DATA_SIZE_CATEGORIES.length - 1].id;
  }

  if (isImageCaptionData(data)) {
    const sizeInK = parseDataSize(data);
    for (const cat of IMAGE_CAPTION_CATEGORIES) {
      if (sizeInK >= cat.min && sizeInK < cat.max) {
        return cat.id;
      }
    }
    return IMAGE_CAPTION_CATEGORIES[IMAGE_CAPTION_CATEGORIES.length - 1].id;
  }

  if (isHistologyPatchData(data)) {
    return HISTOLOGY_PATCH_CATEGORY.id;
  }

  return null;
}

/**
 * Get the label for a WSI data size category ID.
 */
export function getWsiDataSizeCategoryLabel(catId: string): string {
  return DATA_SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
}

/**
 * Get the label for an image-caption category ID.
 */
export function getImageCaptionCategoryLabel(catId: string): string {
  return IMAGE_CAPTION_CATEGORIES.find((c) => c.id === catId)?.label || catId;
}

// =============================================================================
// Training Method Categories
// =============================================================================

/**
 * Training methods that are considered VLM-style.
 */
export const VLM_TRAINING_METHODS = [
  "CLIP",
  "CoCa, iBOT",
  "CoCa, BEiT-3",
  "iBOT, CoCa",
  "Contrastive (custom)",
];

/**
 * Check if a model is a Vision-Language Model (VLM).
 */
export function isVLMModel(model: Model): boolean {
  return (
    model.modelType === "vision-language" ||
    VLM_TRAINING_METHODS.includes(model.trainingMethod || "")
  );
}

/**
 * Get training method category (VLM or specific method).
 */
export function getTrainingMethodCategory(model: Model): string {
  if (isVLMModel(model)) {
    return "VLM";
  }
  return model.trainingMethod || "Unknown";
}

// =============================================================================
// Label Formatters
// =============================================================================

/**
 * Get human-readable label for a license type.
 */
export function getLicenseLabel(license: string): string {
  const labels: Record<string, string> = {
    "open-source": "Open Source",
    "non-commercial": "Non-Commercial",
    "closed-source": "Closed Source",
  };
  return labels[license] || license;
}

/**
 * Get human-readable label for a model type.
 */
export function getModelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    VM: "Vision Model",
    VLM: "Vision-Language Model",
  };
  return labels[type] || type;
}

/**
 * Get human-readable label for a publication type.
 */
export function getPublicationTypeLabel(pubType: string): string {
  const labels: Record<string, string> = {
    "peer-reviewed": "Peer-reviewed",
    preprint: "Preprint",
    blog: "Blog",
  };
  return labels[pubType] || pubType;
}
