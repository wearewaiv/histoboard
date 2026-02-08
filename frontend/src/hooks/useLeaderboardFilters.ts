/**
 * Leaderboard Filters Hook
 *
 * Extends useModelAttributeFilters with leaderboard-specific concerns:
 * - Filters to only ranked models (models that appear in benchmark results)
 * - Adds individual model selection (the "Models" dropdown)
 * - Computes effectiveSelectedIds (intersection of attribute filters and model selection)
 *
 * @module hooks/useLeaderboardFilters
 */

import { useState, useMemo } from "react";
import type { Model, Benchmark } from "@/types";
import {
  useModelAttributeFilters,
  type UseModelAttributeFiltersReturn,
} from "./useModelAttributeFilters";

// =============================================================================
// Types
// =============================================================================

export interface UseLeaderboardFiltersReturn extends UseModelAttributeFiltersReturn {
  // Additional leaderboard-specific state
  selectedModelIds: Set<string>;
  effectiveSelectedIds: Set<string>;
  sortedModels: Model[];

  // Additional toggle/bulk actions
  toggleModel: (id: string) => void;
  selectAllModels: () => void;
  clearAllModels: () => void;

  // Override resetAllFilters to also reset model selection
  resetAllFilters: () => void;
}

// Re-export the filter options type for consumers
export type { ModelAttributeFilterOptions as LeaderboardFilterOptions } from "./useModelAttributeFilters";

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing leaderboard filter state.
 *
 * @param models - All available models
 * @param benchmarks - All benchmarks
 * @param rankings - Rankings data: benchmarkId -> modelId -> { avgRank, taskCount }
 */
export function useLeaderboardFilters(
  models: Model[],
  benchmarks: Benchmark[],
  rankings: Record<string, Record<string, { avgRank: number; taskCount: number }>>
): UseLeaderboardFiltersReturn {
  // Get only models that have rankings in at least one benchmark
  const rankedModels = useMemo(() => {
    return models.filter((m) => benchmarks.some((b) => rankings[b.id]?.[m.id]));
  }, [models, benchmarks, rankings]);

  const allModelIds = useMemo(() => rankedModels.map((m) => m.id), [rankedModels]);

  // Delegate attribute filtering to the shared hook
  const attributeFilters = useModelAttributeFilters(rankedModels);

  // Leaderboard-specific: individual model selection
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(
    () => new Set(allModelIds)
  );

  const toggleInSet = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // Effective selected = intersection of attribute-filtered models and manually selected models
  const filteredModelIds = useMemo(
    () => new Set(attributeFilters.filteredByAttributes.map((m) => m.id)),
    [attributeFilters.filteredByAttributes]
  );

  const effectiveSelectedIds = useMemo(() => {
    return new Set([...selectedModelIds].filter((id) => filteredModelIds.has(id)));
  }, [selectedModelIds, filteredModelIds]);

  // Models sorted alphabetically for the Models dropdown
  const sortedModels = useMemo(() => {
    return [...attributeFilters.filteredByAttributes].sort((a, b) => a.name.localeCompare(b.name));
  }, [attributeFilters.filteredByAttributes]);

  // Reset all filters including model selection
  const resetAllFilters = () => {
    attributeFilters.resetAllFilters();
    setSelectedModelIds(new Set(allModelIds));
  };

  return {
    ...attributeFilters,
    selectedModelIds,
    effectiveSelectedIds,
    sortedModels,
    toggleModel: (id) => toggleInSet(id, setSelectedModelIds),
    selectAllModels: () => setSelectedModelIds(new Set(allModelIds)),
    clearAllModels: () => setSelectedModelIds(new Set()),
    resetAllFilters,
  };
}
