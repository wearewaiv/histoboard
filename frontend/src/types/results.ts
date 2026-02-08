/**
 * Specialized Result Types for Benchmark Tables
 *
 * Different benchmarks store results with varying levels of detail.
 * This module provides typed interfaces for these specialized result formats,
 * enabling type-safe access to benchmark-specific metrics.
 *
 * @module types/results
 */

import type { Result } from "./index";

/**
 * Comprehensive result with multiple metric variants.
 * Used by Stanford PathBench which reports multiple metrics per task.
 */
export interface StanfordResult extends Result {
  /** AUROC score */
  auroc?: number;
  /** Lower confidence bound for AUROC */
  aurocLower?: number;
  /** Upper confidence bound for AUROC */
  aurocUpper?: number;
  /** Balanced accuracy */
  balancedAccuracy?: number;
  /** Lower confidence bound for balanced accuracy */
  balancedAccuracyLower?: number;
  /** Upper confidence bound for balanced accuracy */
  balancedAccuracyUpper?: number;
  /** Sensitivity (true positive rate) */
  sensitivity?: number;
  /** Lower confidence bound for sensitivity */
  sensitivityLower?: number;
  /** Upper confidence bound for sensitivity */
  sensitivityUpper?: number;
  /** Specificity (true negative rate) */
  specificity?: number;
  /** Lower confidence bound for specificity */
  specificityLower?: number;
  /** Upper confidence bound for specificity */
  specificityUpper?: number;
}
