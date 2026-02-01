"use client";

/**
 * Rankings computation hook for Histoboard
 *
 * This hook computes model rankings based on the current filter state.
 * It memoizes the computation to avoid recalculating on every render.
 *
 * @module hooks/useRankings
 */

import { useMemo } from "react";
import type { Model, Task, Result, FilterState, ModelRanking } from "@/types";
import { computeModelRankings, filterResults } from "@/lib/ranking";

// =============================================================================
// Types
// =============================================================================

/**
 * Input options for the useRankings hook.
 */
export interface UseRankingsOptions {
  /** All available models */
  models: Model[];
  /** All task definitions */
  tasks: Task[];
  /** All evaluation results */
  results: Result[];
  /** Current filter state */
  filters: FilterState;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for computing model rankings with filter support.
 *
 * This hook:
 * 1. Filters results based on the current filter state
 * 2. Computes rankings using the filtered results
 * 3. Memoizes the result to avoid unnecessary recomputation
 *
 * The rankings are recalculated whenever any of the inputs change.
 *
 * @param options - Models, tasks, results, and filter state
 * @returns Array of ModelRanking objects, sorted by overall rank
 *
 * @example
 * const { filters } = useFilters();
 * const rankings = useRankings({ models, tasks, results, filters });
 *
 * // Use rankings in a leaderboard
 * rankings.map(ranking => (
 *   <LeaderboardRow key={ranking.modelId} ranking={ranking} />
 * ))
 */
export function useRankings({
  models,
  tasks,
  results,
  filters,
}: UseRankingsOptions): ModelRanking[] {
  return useMemo(() => {
    // First, filter results to only include those matching the filter state
    const filteredResults = filterResults(results, tasks, filters);

    // Then compute rankings based on the filtered results
    return computeModelRankings(models, tasks, filteredResults);
  }, [models, tasks, results, filters]);
}
