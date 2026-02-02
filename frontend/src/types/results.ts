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

// =============================================================================
// Extended Result Types
// =============================================================================

/**
 * Result with standard deviation.
 * Used by benchmarks that report mean ± std over multiple folds/splits.
 *
 * @example PathBench (10-fold cross-validation)
 * @example Sinai SSL (20 MCCV splits)
 */
export interface ResultWithStd extends Result {
  /** Standard deviation of the metric value */
  std?: number;
}

/**
 * Result with confidence intervals.
 * Used by benchmarks that report statistical significance bounds.
 *
 * @example Stanford PathBench (AUROC with confidence intervals)
 */
export interface ResultWithConfidenceInterval extends Result {
  /** Lower bound of confidence interval */
  valueLower?: number;
  /** Upper bound of confidence interval */
  valueUpper?: number;
}

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

/**
 * Result for THUNDER benchmark tasks.
 * Includes task-specific metrics like calibration and adversarial robustness.
 */
export interface THUNDERResult extends Result {
  /** Expected Calibration Error (lower is better) */
  ece?: number;
  /** Adversarial Success Rate (lower is better) */
  asr?: number;
}

/**
 * Result for robustness benchmarks (PathoROB, PLISM).
 * Includes domain shift evaluation metrics.
 */
export interface RobustnessResult extends Result {
  /** Robustness index for domain shift evaluation */
  robustnessIndex?: number;
  /** Cosine similarity across domains */
  cosineSimilarity?: number;
  /** Top-k retrieval accuracy */
  topKAccuracy?: number;
}

// =============================================================================
// Results Map Types
// =============================================================================

/**
 * Nested map structure for efficient result lookups.
 * Map<modelId, Map<taskId, value>>
 *
 * This structure provides O(1) access to any model-task result pair,
 * which is crucial for rendering large tables efficiently.
 */
export type ResultsMap = Map<string, Map<string, number>>;

/**
 * Extended results map that includes standard deviation.
 * Map<modelId, Map<taskId, {value, std}>>
 */
export type ResultsMapWithStd = Map<string, Map<string, { value: number; std?: number }>>;

// =============================================================================
// Task Statistics Types
// =============================================================================

/**
 * Min/max statistics for a task's results.
 * Used for color-coding table cells based on relative performance.
 */
export interface TaskStats {
  /** Minimum value across all models for this task */
  min: number;
  /** Maximum value across all models for this task */
  max: number;
}

/**
 * Map of task statistics for efficient lookup.
 * Map<taskId, TaskStats>
 */
export type TaskStatsMap = Map<string, TaskStats>;

// =============================================================================
// Rank Types
// =============================================================================

/**
 * Model ranking information for a single benchmark.
 */
export interface BenchmarkModelRank {
  /** Model identifier */
  modelId: string;
  /** Average rank across tasks in this benchmark */
  avgRank: number;
  /** Number of tasks this model was evaluated on */
  taskCount: number;
}

/**
 * Integer rank for leaderboard display.
 * Provides the 1-indexed position (1st, 2nd, 3rd...).
 */
export interface ModelIntegerRank {
  /** Model identifier */
  modelId: string;
  /** Integer rank (1 = best) */
  overallRank: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build a nested results map from an array of results.
 * Provides O(1) lookup for any model-task combination.
 *
 * @param results - Array of result objects
 * @returns Nested map for efficient lookups
 */
export function buildResultsMap(results: Result[]): ResultsMap {
  const map = new Map<string, Map<string, number>>();

  for (const result of results) {
    if (!map.has(result.modelId)) {
      map.set(result.modelId, new Map());
    }
    map.get(result.modelId)!.set(result.taskId, result.value);
  }

  return map;
}

/**
 * Build a results map that includes standard deviation values.
 *
 * @param results - Array of result objects with optional std
 * @returns Nested map with value and std
 */
export function buildResultsMapWithStd(
  results: ResultWithStd[]
): ResultsMapWithStd {
  const map = new Map<string, Map<string, { value: number; std?: number }>>();

  for (const result of results) {
    if (!map.has(result.modelId)) {
      map.set(result.modelId, new Map());
    }
    map.get(result.modelId)!.set(result.taskId, {
      value: result.value,
      std: result.std,
    });
  }

  return map;
}

/**
 * Compute min/max statistics for each task.
 * Used for relative color-coding of table cells.
 *
 * @param results - Array of result objects
 * @param taskIds - Optional array of task IDs to compute stats for
 * @returns Map of task ID to min/max stats
 */
export function computeTaskStats(
  results: Result[],
  taskIds?: string[]
): TaskStatsMap {
  const stats = new Map<string, TaskStats>();
  const taskValues = new Map<string, number[]>();

  // Collect values per task
  for (const result of results) {
    if (taskIds && !taskIds.includes(result.taskId)) continue;

    if (!taskValues.has(result.taskId)) {
      taskValues.set(result.taskId, []);
    }
    taskValues.get(result.taskId)!.push(result.value);
  }

  // Compute min/max for each task
  for (const [taskId, values] of taskValues) {
    if (values.length > 0) {
      stats.set(taskId, {
        min: Math.min(...values),
        max: Math.max(...values),
      });
    }
  }

  return stats;
}

/**
 * Compute ranks for models within each task.
 * Returns a map of taskId -> Map<modelId, rank>.
 *
 * @param results - Array of result objects
 * @param higherIsBetter - Whether higher values should rank better (default: true)
 * @returns Map of task ID to model-rank map
 */
export function computeTaskRanks(
  results: Result[],
  higherIsBetter = true
): Map<string, Map<string, number>> {
  const taskResults = new Map<string, Result[]>();

  // Group results by task
  for (const result of results) {
    if (!taskResults.has(result.taskId)) {
      taskResults.set(result.taskId, []);
    }
    taskResults.get(result.taskId)!.push(result);
  }

  // Compute ranks within each task
  const taskRanks = new Map<string, Map<string, number>>();

  for (const [taskId, taskResultList] of taskResults) {
    // Sort by value (descending if higher is better)
    const sorted = [...taskResultList].sort((a, b) =>
      higherIsBetter ? b.value - a.value : a.value - b.value
    );

    const ranks = new Map<string, number>();
    sorted.forEach((r, idx) => {
      ranks.set(r.modelId, idx + 1);
    });

    taskRanks.set(taskId, ranks);
  }

  return taskRanks;
}

/**
 * Compute average rank for each model across specified tasks.
 *
 * @param taskRanks - Map of task ID to model-rank map
 * @param modelIds - Array of model IDs to compute averages for
 * @param taskIds - Optional filter for which tasks to include
 * @returns Map of model ID to average rank
 */
export function computeModelAverageRanks(
  taskRanks: Map<string, Map<string, number>>,
  modelIds: string[],
  taskIds?: string[]
): Map<string, number> {
  const avgRanks = new Map<string, number>();

  for (const modelId of modelIds) {
    const ranks: number[] = [];

    for (const [taskId, modelRanks] of taskRanks) {
      if (taskIds && !taskIds.includes(taskId)) continue;

      const rank = modelRanks.get(modelId);
      if (rank !== undefined) {
        ranks.push(rank);
      }
    }

    if (ranks.length > 0) {
      avgRanks.set(modelId, ranks.reduce((a, b) => a + b, 0) / ranks.length);
    }
  }

  return avgRanks;
}

/**
 * Compute average metric value for each model across specified tasks.
 *
 * @param resultsMap - Nested results map
 * @param modelIds - Array of model IDs
 * @param taskIds - Array of task IDs to include
 * @returns Map of model ID to average value
 */
export function computeModelAverageValues(
  resultsMap: ResultsMap,
  modelIds: string[],
  taskIds: string[]
): Map<string, number> {
  const avgValues = new Map<string, number>();

  for (const modelId of modelIds) {
    const modelResults = resultsMap.get(modelId);
    if (!modelResults) continue;

    const values: number[] = [];
    for (const taskId of taskIds) {
      const value = modelResults.get(taskId);
      if (value !== undefined) {
        values.push(value);
      }
    }

    if (values.length > 0) {
      avgValues.set(modelId, values.reduce((a, b) => a + b, 0) / values.length);
    }
  }

  return avgValues;
}
