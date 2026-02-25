/**
 * Organ and Category Grouping Configuration
 *
 * Different benchmarks use inconsistent naming for the same organ/category
 * (e.g., "cervical" vs "cervix", "colon" vs "colorectal"). These maps
 * normalize raw values into user-friendly display labels. The expansion
 * functions reverse the mapping for filtering.
 *
 * @module lib/organGroups
 */

import type { Task } from "@/types";

// =============================================================================
// Organ Groups
// =============================================================================

/** Mapping from display label to raw organ values from benchmarks. */
export const ORGAN_GROUPS: Record<string, string[]> = {
  Cervix: ["cervical", "cervix"],
  Colorectal: ["colon", "colorectal", "rectum"],
  Gastric: ["gastric", "gi"],
  "Multi-organ": ["multi-organ", "pan-cancer"],
};

/**
 * Get the grouped organ label for a raw organ value.
 * If the organ belongs to a group, returns the group label;
 * otherwise capitalizes the raw value.
 */
export function getOrganGroupLabel(organ: string): string {
  for (const [groupLabel, organs] of Object.entries(ORGAN_GROUPS)) {
    if (organs.includes(organ.toLowerCase())) {
      return groupLabel;
    }
  }
  return organ.charAt(0).toUpperCase() + organ.slice(1);
}

/**
 * Get sorted unique grouped organ labels from a list of tasks.
 */
export function getUniqueGroupedOrgans(tasks: Task[]): string[] {
  const groupedOrgans = new Set<string>();
  for (const task of tasks) {
    groupedOrgans.add(getOrganGroupLabel(task.organ));
  }
  return [...groupedOrgans].sort();
}

/**
 * Count unique grouped organs in a list of tasks.
 */
export function countUniqueOrgans(tasks: Task[]): number {
  const groupedOrgans = new Set<string>();
  for (const task of tasks) {
    groupedOrgans.add(getOrganGroupLabel(task.organ));
  }
  return groupedOrgans.size;
}

/**
 * Expand a grouped organ label back to its underlying raw values for filtering.
 * If the label is not a group, returns the lowercased label.
 */
export function expandOrganGroup(organLabel: string): string[] {
  if (ORGAN_GROUPS[organLabel]) {
    return ORGAN_GROUPS[organLabel];
  }
  return [organLabel.toLowerCase()];
}

// =============================================================================
// Task Category Groups (used by Arena page)
// =============================================================================

/**
 * Mapping from display label to raw task category values from benchmarks.
 * Groups semantically similar categories under a single label.
 */
export const TASK_CATEGORY_GROUPS: Record<string, string[]> = {
  "Biomarker prediction": [
    "Biomarker",
    "Biomarker Status Prediction",
    "Molecular Prediction",
  ],
  "Cancer detection": ["Detection"],
  "Classification NOS": [
    "Classification",
    "classification",
    "slide-level",
    "patch-level",
  ],
  "Gene expression prediction": ["Gene Expression Prediction"],
  "Histological subtype prediction": [
    "Diagnostic: Primary Diagnosis and Histologic Subtyping",
    "Diagnostic: Histologic Subtyping",
  ],
  "Molecular subtype prediction": ["Gene Expression Subtype Prediction"],
  "Morphology prediction": ["Morphology"],
  Other: ["Diagnostic: Other"],
  "Pathway activation status prediction": [
    "Pathway Activation Status Prediction",
  ],
  "Primary diagnosis prediction": ["Diagnostic: Primary Diagnosis"],
  Robustness: [
    "Robustness",
    "Combined Robustness",
    "Stain Robustness",
    "Scanner Robustness",
    "Domain Shift",
    "Embedding Consistency",
  ],
  Segmentation: ["Segmentation", "segmentation"],
  "Survival prediction": ["survival", "Survival Prediction", "Prognosis"],
  "Tissue type classification": [
    "Diagnostic: Tissue type classification",
  ],
  "TME characterization": ["TME Characterization"],
  "Treatment response": ["Treatment Response"],
  "Tumor grading": [
    "Tumor Grading",
    "Diagnostic: Tumor Grading",
    "Diagnostic: Primary Diagnosis and Tumor Grading",
  ],
  "Tumor staging": ["Diagnostic: Tumor Staging"],
};

/**
 * Get the grouped category label for a raw category value.
 * If the category belongs to a group, returns the group label;
 * otherwise returns the raw value as-is.
 */
export function getCategoryGroupLabel(category: string): string {
  for (const [groupLabel, categories] of Object.entries(
    TASK_CATEGORY_GROUPS
  )) {
    if (categories.includes(category)) {
      return groupLabel;
    }
  }
  return category;
}

/**
 * Get sorted unique grouped task categories from a list of tasks.
 */
export function getUniqueGroupedCategories(tasks: Task[]): string[] {
  const groupedCategories = new Set<string>();
  for (const task of tasks) {
    if (task.category) {
      groupedCategories.add(getCategoryGroupLabel(task.category as string));
    }
  }
  return [...groupedCategories].sort();
}

/**
 * Expand a grouped category label back to its underlying raw values for filtering.
 * If the label is not a group, returns it as-is in an array.
 */
export function expandCategoryGroup(categoryLabel: string): string[] {
  if (TASK_CATEGORY_GROUPS[categoryLabel]) {
    return TASK_CATEGORY_GROUPS[categoryLabel];
  }
  return [categoryLabel];
}
