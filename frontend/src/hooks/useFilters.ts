"use client";

/**
 * Filter state management hook for Histoboard
 *
 * This hook manages the filter state for leaderboards and result tables.
 * It provides toggle functions for each filter dimension and tracks
 * whether any filters are currently active.
 *
 * @module hooks/useFilters
 */

import { useState, useCallback, useMemo } from "react";
import type { FilterState, BenchmarkCategory } from "@/types";

// =============================================================================
// Types
// =============================================================================

/**
 * Return type for the useFilters hook.
 */
export interface UseFiltersReturn {
  /** Current filter state */
  filters: FilterState;
  /** Toggle a category filter on/off */
  toggleCategory: (category: BenchmarkCategory) => void;
  /** Toggle an organ filter on/off */
  toggleOrgan: (organ: string) => void;
  /** Toggle a benchmark filter on/off */
  toggleBenchmark: (benchmark: string) => void;
  /** Set the minimum tasks threshold */
  setMinTasks: (minTasks: number) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Whether any filters are currently active */
  hasActiveFilters: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default filter state - no filters applied.
 * Empty arrays mean "include all" for that dimension.
 */
const DEFAULT_FILTERS: FilterState = {
  categories: [],
  organs: [],
  benchmarks: [],
  minTasks: 0,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing filter state in leaderboards and result tables.
 *
 * Each filter dimension (categories, organs, benchmarks) uses a "toggle" pattern:
 * - Items not in the array are included (empty = all included)
 * - When you toggle an item, it's added to the array (now filtered)
 * - Toggle again to remove it (back to included)
 *
 * @param initialFilters - Optional initial filter values to merge with defaults
 * @returns Filter state and control functions
 *
 * @example
 * const { filters, toggleCategory, hasActiveFilters } = useFilters();
 *
 * // Toggle the "pathology" category filter
 * toggleCategory("pathology");
 *
 * // Check if any filters are active
 * if (hasActiveFilters) {
 *   showResetButton();
 * }
 */
export function useFilters(
  initialFilters?: Partial<FilterState>
): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  /**
   * Toggle a category filter on/off.
   * If the category is in the filter list, remove it; otherwise, add it.
   */
  const toggleCategory = useCallback((category: BenchmarkCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  /**
   * Toggle an organ filter on/off.
   */
  const toggleOrgan = useCallback((organ: string) => {
    setFilters((prev) => ({
      ...prev,
      organs: prev.organs.includes(organ)
        ? prev.organs.filter((o) => o !== organ)
        : [...prev.organs, organ],
    }));
  }, []);

  /**
   * Toggle a benchmark filter on/off.
   */
  const toggleBenchmark = useCallback((benchmark: string) => {
    setFilters((prev) => ({
      ...prev,
      benchmarks: prev.benchmarks.includes(benchmark)
        ? prev.benchmarks.filter((b) => b !== benchmark)
        : [...prev.benchmarks, benchmark],
    }));
  }, []);

  /**
   * Set the minimum number of tasks a model must have results for.
   */
  const setMinTasks = useCallback((minTasks: number) => {
    setFilters((prev) => ({ ...prev, minTasks }));
  }, []);

  /**
   * Reset all filters to their default (no filters) state.
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Computed flag indicating whether any filters are currently active.
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.organs.length > 0 ||
      filters.benchmarks.length > 0 ||
      filters.minTasks > 0
    );
  }, [filters]);

  return {
    filters,
    toggleCategory,
    toggleOrgan,
    toggleBenchmark,
    setMinTasks,
    resetFilters,
    hasActiveFilters,
  };
}
