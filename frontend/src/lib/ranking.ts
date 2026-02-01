/**
 * Ranking Computation Module for Histoboard
 *
 * This module calculates which models are "best" by comparing their performance
 * across multiple benchmark tasks. It's like computing sports standings, but for
 * machine learning models.
 *
 * ## The Problem We're Solving
 *
 * Imagine you have 30 models, each evaluated on 100 different tasks.
 * How do you determine which model is "best overall"?
 *
 * The approach:
 * 1. For each task, rank the models (1st place, 2nd place, etc.)
 * 2. Average each model's ranks across all tasks
 * 3. The model with the lowest average rank wins
 *
 * ## Step-by-Step Example
 *
 * ```
 * Task 1: Model A scores 0.90, Model B scores 0.85, Model C scores 0.80
 *         → Ranks: A=1, B=2, C=3
 *
 * Task 2: Model A scores 0.70, Model B scores 0.75, Model C scores 0.85
 *         → Ranks: A=3, B=2, C=1
 *
 * Average Ranks:
 *   Model A: (1 + 3) / 2 = 2.0
 *   Model B: (2 + 2) / 2 = 2.0  (tie!)
 *   Model C: (3 + 1) / 2 = 2.0  (three-way tie!)
 *
 * Overall Ranking: A, B, C are tied for 1st place
 * ```
 *
 * ## Key Functions
 *
 * 1. **computeTaskRanks** - Ranks models for a single task
 * 2. **aggregateRanks** - Combines per-task ranks into overall scores
 * 3. **filterResults** - Filters data by benchmark, organ, category
 * 4. **computeModelRankings** - The main function that does everything
 *
 * ## Handling Ties
 *
 * When two models have the same score on a task, we need a "tie-breaking strategy":
 *
 * - **average**: Both get the average rank (e.g., tied for 2nd/3rd → both get 2.5)
 * - **min**: Both get the better rank (e.g., tied for 2nd/3rd → both get 2)
 * - **max**: Both get the worse rank (e.g., tied for 2nd/3rd → both get 3)
 *
 * ## Aggregation Methods
 *
 * - **mean**: Average of all ranks (most common, sensitive to outliers)
 * - **median**: Middle rank when sorted (robust to outliers)
 * - **borda**: Gives more points for better ranks (used in voting systems)
 *
 * ## Usage Example
 *
 * ```typescript
 * import { computeModelRankings } from "@/lib/ranking";
 *
 * const rankings = computeModelRankings(models, tasks, results, {
 *   method: "mean",
 *   tieBreaking: "average"
 * });
 *
 * // rankings[0] is the best model
 * console.log(`Winner: ${rankings[0].modelName}`);
 * console.log(`Average rank: ${rankings[0].meanRank}`);
 * ```
 *
 * @module lib/ranking
 */

import type {
  Result,
  ModelRanking,
  Task,
  Model,
  FilterState,
  RankingConfig,
  BenchmarkCategory,
  TieBreakingStrategy,
  RankingMethod,
} from "@/types";

// =============================================================================
// Statistical Helpers
// =============================================================================

/**
 * Compute the arithmetic mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute the median of an array of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// =============================================================================
// Per-Task Ranking
// =============================================================================

/**
 * Compute ranks for models on a single task.
 *
 * Higher metric values are assumed to be better (rank 1 = best performance).
 * Ties are handled according to the specified tie-breaking strategy.
 *
 * @param results - Results for a single task
 * @param tieBreaking - Strategy for handling tied values:
 *   - "average": Tied values receive the average of their ranks (e.g., ranks 2,3 → both get 2.5)
 *   - "min": Tied values receive the minimum rank (e.g., ranks 2,3 → both get 2)
 *   - "max": Tied values receive the maximum rank (e.g., ranks 2,3 → both get 3)
 * @returns Map from modelId to rank
 *
 * @example
 * // If model A has 0.9, model B has 0.8, model C has 0.8:
 * // With "average": A=1, B=2.5, C=2.5
 * // With "min": A=1, B=2, C=2
 * // With "max": A=1, B=3, C=3
 */
export function computeTaskRanks(
  results: Result[],
  tieBreaking: TieBreakingStrategy = "average"
): Map<string, number> {
  // Sort by value descending (higher is better)
  const sorted = [...results].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();

  let currentRank = 1;
  let i = 0;

  while (i < sorted.length) {
    const currentValue = sorted[i].value;
    const tiedResults: Result[] = [];

    // Collect all results with the same value
    while (i < sorted.length && sorted[i].value === currentValue) {
      tiedResults.push(sorted[i]);
      i++;
    }

    // Compute rank based on tie-breaking strategy
    let assignedRank: number;
    switch (tieBreaking) {
      case "average":
        // Average of the ranks these items would occupy
        assignedRank = currentRank + (tiedResults.length - 1) / 2;
        break;
      case "min":
        // Best (lowest) rank in the group
        assignedRank = currentRank;
        break;
      case "max":
        // Worst (highest) rank in the group
        assignedRank = currentRank + tiedResults.length - 1;
        break;
    }

    // Assign the computed rank to all tied results
    for (const result of tiedResults) {
      ranks.set(result.modelId, assignedRank);
    }

    currentRank += tiedResults.length;
  }

  return ranks;
}

// =============================================================================
// Rank Aggregation
// =============================================================================

/**
 * Aggregate ranks across multiple tasks into a single score per model.
 *
 * @param ranksByTask - Map from taskId to (Map from modelId to rank)
 * @param method - Aggregation method:
 *   - "mean": Arithmetic mean of ranks (lower is better)
 *   - "median": Median rank (robust to outliers)
 *   - "borda": Borda count - sum of (n - rank + 1) where n = max rank (higher is better)
 * @returns Map from modelId to aggregated score
 */
export function aggregateRanks(
  ranksByTask: Map<string, Map<string, number>>,
  method: RankingMethod = "mean"
): Map<string, number> {
  // Collect all ranks for each model
  const modelRanks = new Map<string, number[]>();

  for (const taskRanks of ranksByTask.values()) {
    for (const [modelId, rank] of taskRanks) {
      if (!modelRanks.has(modelId)) {
        modelRanks.set(modelId, []);
      }
      modelRanks.get(modelId)!.push(rank);
    }
  }

  // Aggregate ranks for each model
  const aggregated = new Map<string, number>();

  for (const [modelId, ranks] of modelRanks) {
    let score: number;

    switch (method) {
      case "mean":
        score = mean(ranks);
        break;
      case "median":
        score = median(ranks);
        break;
      case "borda":
        // Borda count: sum of (n - rank + 1) where n is the max rank
        // This converts ranks to points where 1st place gets n points
        const n = Math.max(...ranks);
        score = ranks.reduce((sum, r) => sum + (n - r + 1), 0);
        break;
    }

    aggregated.set(modelId, score);
  }

  return aggregated;
}

// =============================================================================
// Result Filtering
// =============================================================================

/**
 * Filter results based on the current filter state.
 *
 * All filters are applied as "any of" (OR within a filter type).
 * Empty filter arrays mean "include all" for that dimension.
 *
 * @param results - All results to filter
 * @param tasks - Task definitions for looking up metadata
 * @param filters - Current filter state
 * @returns Filtered results matching all specified criteria
 */
export function filterResults(
  results: Result[],
  tasks: Task[],
  filters: FilterState
): Result[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return results.filter((result) => {
    const task = taskMap.get(result.taskId);
    if (!task) return false;

    // Check category filter
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(task.category as BenchmarkCategory)
    ) {
      return false;
    }

    // Check organ filter
    if (filters.organs.length > 0 && !filters.organs.includes(task.organ)) {
      return false;
    }

    // Check benchmark filter
    if (
      filters.benchmarks.length > 0 &&
      !filters.benchmarks.includes(task.benchmarkId)
    ) {
      return false;
    }

    return true;
  });
}

// =============================================================================
// Full Model Rankings
// =============================================================================

/**
 * Extract ranks for a model filtered by a set of task IDs.
 */
function extractRanksForTasks(
  modelId: string,
  taskIds: Set<string>,
  ranksByTask: Map<string, Map<string, number>>
): number[] {
  const ranks: number[] = [];
  for (const [taskId, taskRanks] of ranksByTask) {
    if (taskIds.has(taskId)) {
      const rank = taskRanks.get(modelId);
      if (rank !== undefined) {
        ranks.push(rank);
      }
    }
  }
  return ranks;
}

/**
 * Compute comprehensive model rankings with breakdowns by category and organ.
 *
 * This is the main ranking function that produces the full ModelRanking objects
 * used for leaderboard display.
 *
 * @param models - All models to rank
 * @param tasks - Task definitions
 * @param results - Evaluation results (pre-filtered if needed)
 * @param config - Ranking configuration
 * @returns Array of ModelRanking objects, sorted by overall rank
 *
 * @example
 * const rankings = computeModelRankings(models, tasks, results, {
 *   method: "mean",
 *   tieBreaking: "average"
 * });
 * // rankings[0] is the top-ranked model
 */
export function computeModelRankings(
  models: Model[],
  tasks: Task[],
  results: Result[],
  config: RankingConfig = { method: "mean", tieBreaking: "average" }
): ModelRanking[] {
  // Group results by task for efficient lookup
  const resultsByTask = new Map<string, Result[]>();
  for (const result of results) {
    if (!resultsByTask.has(result.taskId)) {
      resultsByTask.set(result.taskId, []);
    }
    resultsByTask.get(result.taskId)!.push(result);
  }

  // Compute ranks for each task
  const ranksByTask = new Map<string, Map<string, number>>();
  for (const [taskId, taskResults] of resultsByTask) {
    ranksByTask.set(taskId, computeTaskRanks(taskResults, config.tieBreaking));
  }

  // Aggregate overall ranks
  const overallScores = aggregateRanks(ranksByTask, config.method);

  // Get unique categories and organs for breakdown computation
  const categories = [...new Set(tasks.map((t) => t.category))];
  const organs = [...new Set(tasks.map((t) => t.organ))];

  // Pre-compute task ID sets for each category and organ
  const taskIdsByCategory = new Map<string, Set<string>>();
  const taskIdsByOrgan = new Map<string, Set<string>>();

  for (const category of categories) {
    taskIdsByCategory.set(
      category,
      new Set(tasks.filter((t) => t.category === category).map((t) => t.id))
    );
  }
  for (const organ of organs) {
    taskIdsByOrgan.set(
      organ,
      new Set(tasks.filter((t) => t.organ === organ).map((t) => t.id))
    );
  }

  // Compute rankings for each model
  const rankings: ModelRanking[] = [];

  for (const model of models) {
    // Collect all ranks for this model
    const modelRanksArray: number[] = [];
    for (const taskRanks of ranksByTask.values()) {
      const rank = taskRanks.get(model.id);
      if (rank !== undefined) {
        modelRanksArray.push(rank);
      }
    }

    // Skip models with no results
    if (modelRanksArray.length === 0) continue;

    // Compute category breakdowns
    const ranksByCategory = {} as Record<BenchmarkCategory, number | null>;
    for (const category of categories) {
      const taskIds = taskIdsByCategory.get(category)!;
      const categoryRanks = extractRanksForTasks(model.id, taskIds, ranksByTask);
      ranksByCategory[category as BenchmarkCategory] =
        categoryRanks.length > 0 ? mean(categoryRanks) : null;
    }

    // Compute organ breakdowns
    const ranksByOrgan: Record<string, number | null> = {};
    for (const organ of organs) {
      const taskIds = taskIdsByOrgan.get(organ)!;
      const organRanks = extractRanksForTasks(model.id, taskIds, ranksByTask);
      ranksByOrgan[organ] = organRanks.length > 0 ? mean(organRanks) : null;
    }

    rankings.push({
      modelId: model.id,
      modelName: model.name,
      overallRank: 0, // Will be assigned after sorting
      meanRank: overallScores.get(model.id) ?? 0,
      medianRank: median(modelRanksArray),
      tasksEvaluated: modelRanksArray.length,
      ranksByCategory,
      ranksByOrgan,
    });
  }

  // Sort by mean rank and assign overall ranks
  rankings.sort((a, b) => a.meanRank - b.meanRank);
  rankings.forEach((ranking, index) => {
    ranking.overallRank = index + 1;
  });

  return rankings;
}
