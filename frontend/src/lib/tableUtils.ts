/**
 * Table Utilities for Detailed Benchmark Tables
 *
 * This module provides specialized utilities for rendering detailed benchmark
 * tables, including formatting functions, dropdown option builders, and
 * category/organ mappers.
 *
 * These utilities are designed to work with the useSetToggle and useTaskFiltering
 * hooks to provide a consistent experience across all benchmark tables.
 *
 * @module lib/tableUtils
 */

import type { Task, Model } from "@/types";

// =============================================================================
// Dropdown Option Types
// =============================================================================

/**
 * Option structure for MultiSelectDropdown component
 */
export interface DropdownOption {
  id: string;
  label: string;
}

// =============================================================================
// Option Builders
// =============================================================================

/**
 * Build sorted dropdown options from a list of values.
 * Applies a formatting function to create display labels.
 *
 * @param values - Array of values to create options from
 * @param formatFn - Optional function to format the label (default: capitalize)
 * @returns Sorted array of dropdown options
 *
 * @example
 * const organs = ['breast', 'lung', 'kidney'];
 * const options = buildDropdownOptions(organs, formatOrganLabel);
 * // [{ id: 'breast', label: 'Breast' }, { id: 'kidney', label: 'Kidney' }, ...]
 */
export function buildDropdownOptions(
  values: string[],
  formatFn: (value: string) => string = capitalize
): DropdownOption[] {
  return values
    .map((value) => ({
      id: value,
      label: formatFn(value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Build dropdown options for organs with proper formatting.
 * Uses the standard organ label formatting.
 *
 * @param organs - Array of organ identifiers
 * @returns Sorted array of dropdown options
 */
export function buildOrganOptions(organs: string[]): DropdownOption[] {
  return buildDropdownOptions(organs, formatOrganForDropdown);
}

/**
 * Build dropdown options for task categories.
 *
 * @param categories - Array of category identifiers
 * @returns Sorted array of dropdown options
 */
export function buildCategoryOptions(categories: string[]): DropdownOption[] {
  return buildDropdownOptions(categories, formatCategoryForDropdown);
}

/**
 * Build dropdown options for task names (passthrough formatting).
 *
 * @param taskNames - Array of task names
 * @returns Sorted array of dropdown options
 */
export function buildTaskNameOptions(taskNames: string[]): DropdownOption[] {
  return taskNames
    .map((name) => ({ id: name, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Capitalize the first letter of a string.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format organ name for dropdown display.
 * Handles special cases and capitalizes appropriately.
 *
 * @param organ - Organ identifier
 * @returns Formatted display name
 */
export function formatOrganForDropdown(organ: string): string {
  const specialCases: Record<string, string> = {
    "multi-organ": "Multi-organ",
    "pan-cancer": "Pan-cancer",
    "head-neck": "Head & Neck",
    "soft-tissue": "Soft Tissue",
    gi: "GI",
  };

  const lower = organ.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  return organ.charAt(0).toUpperCase() + organ.slice(1);
}

/**
 * Format category name for dropdown display.
 *
 * @param category - Category identifier
 * @returns Formatted display name
 */
export function formatCategoryForDropdown(category: string): string {
  const specialCases: Record<string, string> = {
    classification: "Classification",
    survival: "Survival",
    segmentation: "Segmentation",
    retrieval: "Retrieval",
    "spatial-transcriptomics": "Spatial Transcriptomics",
    robustness: "Robustness",
    calibration: "Calibration",
    os: "OS",
    dfs: "DFS",
    dss: "DSS",
    pfs: "PFS",
    rfs: "RFS",
    morphology: "Morphology",
    biomarker: "Biomarker",
    prognosis: "Prognosis",
  };

  const lower = category.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  // Convert snake_case to Title Case
  return category
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// =============================================================================
// Task Name Formatters (Benchmark-Specific)
// =============================================================================

/**
 * Format task name for Stanford benchmark.
 * Handles special naming conventions used in Stanford PathBench.
 *
 * @param name - Original task name
 * @returns Formatted display name
 */
export function formatStanfordTaskName(name: string): string {
  const nameMap: Record<string, string> = {
    "lung exp subtype": "Lung Expression Subtype",
    "lusc vs luad": "LUSC vs LUAD",
    "luad subtype": "LUAD Subtype",
    "brain subtype": "Brain Subtype",
    "glioma subtype": "Glioma Subtype",
    "gbm subtype": "GBM Subtype",
    "brca subtype": "BRCA Subtype",
    "prad gleason": "Prostate Gleason",
    "kirc stage": "Kidney Stage",
    "crc msi": "CRC MSI",
  };

  // Check direct mapping
  const lower = name.toLowerCase();
  if (nameMap[lower]) {
    return nameMap[lower];
  }

  // Format: capitalize each word, handle abbreviations
  return name
    .split(/[\s_-]+/)
    .map((word) => {
      // Keep uppercase for known abbreviations
      const upperWord = word.toUpperCase();
      if (["MSI", "GBM", "LUAD", "LUSC", "CRC", "BRCA", "PRAD", "KIRC"].includes(upperWord)) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

// =============================================================================
// Category Extractors
// =============================================================================

/**
 * Extract category from PathBench task.
 * Handles survival task grouping and category normalization.
 *
 * @param task - Task object
 * @returns Extracted category string
 */
export function getPathBenchCategory(task: Task): string {
  const category = typeof task.category === "string" ? task.category : "";
  const lower = category.toLowerCase();

  // Group survival tasks
  if (["os", "dfs", "dss", "pfs", "rfs"].includes(lower)) {
    return "Survival";
  }

  return formatCategoryForDropdown(category);
}

/**
 * Extract classification level from Stanford task.
 * Maps tasks to "Patch-level" or "Slide-level" categories.
 *
 * @param task - Task object
 * @returns Classification level string
 */
export function getStanfordClassificationLevel(task: Task): string {
  // Stanford tasks are typically slide-level unless specified otherwise
  const name = task.name.toLowerCase();

  if (name.includes("patch") || name.includes("tile")) {
    return "Patch-level";
  }

  return "Slide-level";
}

// =============================================================================
// Model Sorting
// =============================================================================

/**
 * Sort models by their average rank (ascending).
 *
 * @param models - Array of model objects
 * @param avgRanks - Map of model ID to average rank
 * @returns Sorted array of models
 */
export function sortModelsByRank(
  models: Model[],
  avgRanks: Map<string, number>
): Model[] {
  return [...models].sort((a, b) => {
    const rankA = avgRanks.get(a.id) ?? 999;
    const rankB = avgRanks.get(b.id) ?? 999;
    return rankA - rankB;
  });
}

/**
 * Sort models by their average metric value (descending for higher-is-better).
 *
 * @param models - Array of model objects
 * @param avgValues - Map of model ID to average value
 * @param higherIsBetter - Whether higher values are better (default: true)
 * @returns Sorted array of models
 */
export function sortModelsByValue(
  models: Model[],
  avgValues: Map<string, number>,
  higherIsBetter = true
): Model[] {
  return [...models].sort((a, b) => {
    const valueA = avgValues.get(a.id) ?? (higherIsBetter ? -Infinity : Infinity);
    const valueB = avgValues.get(b.id) ?? (higherIsBetter ? -Infinity : Infinity);
    return higherIsBetter ? valueB - valueA : valueA - valueB;
  });
}

// =============================================================================
// Table CSS Classes
// =============================================================================

/**
 * Common CSS classes for table container with scroll.
 */
export const TABLE_CONTAINER_CLASSES =
  "overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-lg";

/**
 * Common CSS classes for table element.
 */
export const TABLE_CLASSES = "w-full border-collapse text-sm";

/**
 * Common CSS classes for sticky header row.
 */
export const THEAD_CLASSES = "sticky top-0 z-20";

/**
 * Common CSS classes for header row.
 */
export const TR_HEADER_CLASSES = "border-b bg-muted";

/**
 * Common CSS classes for sticky first column (model name) header.
 */
export const TH_MODEL_CLASSES =
  "sticky left-0 z-30 bg-muted px-3 py-2 text-left font-semibold min-w-[150px]";

/**
 * Common CSS classes for sticky first column (model name) cell.
 */
export const TD_MODEL_CLASSES = "sticky left-0 z-10 bg-background px-3 py-2 border-r";

/**
 * Common CSS classes for average rank/metric columns.
 */
export const TH_AVG_CLASSES =
  "px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80";

/**
 * Common CSS classes for metric value cells.
 */
export const TD_VALUE_CLASSES = "px-2 py-2 text-center tabular-nums";

/**
 * Common CSS classes for average columns in body.
 */
export const TD_AVG_CLASSES = "px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold";
