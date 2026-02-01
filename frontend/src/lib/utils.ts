/**
 * Utility Functions for Histoboard
 *
 * This module contains small, reusable helper functions used throughout the app.
 * These are "pure" functions - they take input and return output without side effects.
 *
 * ## What's in This File
 *
 * 1. **CSS Utilities** (`cn`)
 *    - Combines CSS class names together
 *    - Handles Tailwind CSS class conflicts automatically
 *
 * 2. **Number Formatting** (`formatNumber`)
 *    - Converts numbers like 0.85678 to "0.857" for display
 *
 * 3. **Rank Formatting** (`formatRank`, `getRankColor`)
 *    - Converts 1 → "1st", 2 → "2nd", etc.
 *    - Assigns colors to ranks (green=good, red=bad)
 *
 * 4. **Label Formatting** (`formatMetricLabel`, `formatOrganLabel`)
 *    - Converts technical identifiers to human-readable text
 *    - Example: "auroc" → "AUROC", "breast" → "Breast"
 *
 * 5. **Table Cell Coloring** (`getValueColor`)
 *    - Assigns background colors to table cells based on performance
 *    - High values get green backgrounds, low values get red
 *
 * ## Why These Functions Exist
 *
 * Instead of writing the same formatting code in 20 different components,
 * we define it once here and import it everywhere. This means:
 * - Less code duplication
 * - Consistent formatting across the app
 * - Easy to change formatting in one place
 *
 * ## Usage Example
 *
 * ```typescript
 * import { cn, formatNumber, getRankColor } from "@/lib/utils";
 *
 * // Combine CSS classes
 * const className = cn("px-4 py-2", isActive && "bg-blue-500");
 *
 * // Format a number
 * const display = formatNumber(0.85678, 2);  // "0.86"
 *
 * // Get color classes for rank #3 out of 10
 * const colorClass = getRankColor(3, 10);    // "text-green-600 bg-green-50"
 * ```
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// =============================================================================
// CSS Utilities
// =============================================================================

/**
 * Compose CSS class names with Tailwind CSS merge support.
 * Combines clsx for conditional classes with tailwind-merge to handle
 * Tailwind class conflicts (e.g., "p-2 p-4" becomes "p-4").
 *
 * @example
 * cn("px-2 py-1", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format a number with a fixed number of decimal places.
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted string representation
 *
 * @example
 * formatNumber(0.8567, 2) // "0.86"
 * formatNumber(0.8567)    // "0.857"
 */
export function formatNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals);
}

// =============================================================================
// Rank Formatting
// =============================================================================

/**
 * Format a rank number with ordinal suffix.
 *
 * @param rank - The rank number (1-based)
 * @returns Formatted rank string (e.g., "1st", "2nd", "3rd", "4th")
 *
 * @example
 * formatRank(1)  // "1st"
 * formatRank(2)  // "2nd"
 * formatRank(11) // "11th"
 */
export function formatRank(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

/**
 * Get Tailwind CSS classes for color-coding a rank.
 * Colors range from green (top performers) to red (bottom performers).
 *
 * @param rank - The rank to color-code (1-based)
 * @param total - Total number of items being ranked
 * @returns Tailwind CSS class string for text and background color
 *
 * @example
 * getRankColor(1, 10)  // "text-emerald-600 bg-emerald-50" (top 20%)
 * getRankColor(5, 10)  // "text-yellow-600 bg-yellow-50"  (middle)
 * getRankColor(10, 10) // "text-red-600 bg-red-50"        (bottom 20%)
 */
export function getRankColor(rank: number, total: number): string {
  // Handle edge case where total is 1
  if (total <= 1) return "text-emerald-600 bg-emerald-50";

  const ratio = (rank - 1) / (total - 1);

  if (ratio <= 0.2) return "text-emerald-600 bg-emerald-50";
  if (ratio <= 0.4) return "text-green-600 bg-green-50";
  if (ratio <= 0.6) return "text-yellow-600 bg-yellow-50";
  if (ratio <= 0.8) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

// =============================================================================
// Label Formatting
// =============================================================================

/**
 * Mapping of metric identifiers to human-readable display names.
 * Handles various naming conventions across different benchmarks.
 */
const METRIC_DISPLAY_NAMES: Record<string, string> = {
  auc: "AUROC",
  auroc: "AUROC",
  balanced_accuracy: "Balanced accuracy",
  balanced_acc: "Balanced accuracy",
  "c-index": "C-Index",
  c_index: "C-Index",
  qwk: "QWK",
  kappa: "Kappa",
  dice: "Dice",
  pearson: "Pearson",
  accuracy: "Accuracy",
  ece: "ECE",
  success_rate: "Success Rate",
  cosine_similarity: "Cosine Sim.",
  top10_accuracy: "Top-10 Acc.",
  robustness_index: "Robustness Index",
};

/**
 * Format a metric identifier for display.
 * Converts technical metric names to human-readable labels.
 *
 * @param metric - The metric identifier
 * @returns Human-readable metric name
 *
 * @example
 * formatMetricLabel("auroc")             // "AUROC"
 * formatMetricLabel("balanced_accuracy") // "Balanced accuracy"
 * formatMetricLabel("unknown")           // "unknown" (passthrough)
 */
export function formatMetricLabel(metric: string): string {
  return METRIC_DISPLAY_NAMES[metric.toLowerCase()] ?? metric;
}

/**
 * Mapping of organ identifiers to display names.
 * Handles special cases that don't follow simple capitalization rules.
 */
const ORGAN_DISPLAY_NAMES: Record<string, string> = {
  "multi-organ": "Multi-organ",
  "pan-cancer": "Pan-cancer",
  "head-neck": "Head & Neck",
  "soft tissue": "Soft Tissue",
  gi: "GI",
};

/**
 * Format an organ/indication name for display.
 * Handles special abbreviations and capitalizes words appropriately.
 *
 * @param organ - The organ identifier
 * @returns Human-readable organ name
 *
 * @example
 * formatOrganLabel("breast")      // "Breast"
 * formatOrganLabel("pan-cancer")  // "Pan-cancer"
 * formatOrganLabel("head-neck")   // "Head & Neck"
 */
export function formatOrganLabel(organ: string): string {
  const lowerOrgan = organ.toLowerCase();

  // Check for special cases first
  if (ORGAN_DISPLAY_NAMES[lowerOrgan]) {
    return ORGAN_DISPLAY_NAMES[lowerOrgan];
  }

  // Default: capitalize first letter of each word
  return organ
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// =============================================================================
// Table Value Coloring
// =============================================================================

/**
 * Task statistics for color scaling in detailed tables.
 */
export interface TaskValueStats {
  min: number;
  max: number;
}

/**
 * Get Tailwind CSS classes for color-coding a value based on relative performance.
 * Colors range from emerald (best performers) through gray (average) to red (worst).
 *
 * Uses normalized position within the min-max range:
 * - >= 90%: emerald (top performers)
 * - >= 70%: green (above average)
 * - >= 30%: gray (average)
 * - >= 10%: orange (below average)
 * - < 10%: red (bottom performers)
 *
 * @param value - The metric value to color
 * @param stats - Task min/max statistics for normalization
 * @returns Tailwind CSS class string, or empty string if coloring not applicable
 *
 * @example
 * const stats = { min: 0.5, max: 0.9 };
 * getValueColor(0.88, stats) // "bg-emerald-100 text-emerald-800" (top 90%)
 * getValueColor(0.70, stats) // "bg-gray-50" (middle range)
 * getValueColor(0.52, stats) // "bg-red-50 text-red-700" (near bottom)
 */
export function getValueColor(
  value: number,
  stats: TaskValueStats | undefined
): string {
  if (!stats || stats.max === stats.min) return "";

  const normalized = (value - stats.min) / (stats.max - stats.min);

  if (normalized >= 0.9) return "bg-emerald-100 text-emerald-800";
  if (normalized >= 0.7) return "bg-green-50 text-green-700";
  if (normalized >= 0.3) return "bg-gray-50";
  if (normalized >= 0.1) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}
