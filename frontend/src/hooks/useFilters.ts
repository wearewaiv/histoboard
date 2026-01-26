"use client";

import { useState, useCallback, useMemo } from "react";
import type { FilterState, BenchmarkCategory } from "@/types";

const defaultFilters: FilterState = {
  categories: [],
  organs: [],
  benchmarks: [],
  minTasks: 0,
};

export function useFilters(initialFilters?: Partial<FilterState>) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });

  const toggleCategory = useCallback((category: BenchmarkCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const toggleOrgan = useCallback((organ: string) => {
    setFilters((prev) => ({
      ...prev,
      organs: prev.organs.includes(organ)
        ? prev.organs.filter((o) => o !== organ)
        : [...prev.organs, organ],
    }));
  }, []);

  const toggleBenchmark = useCallback((benchmark: string) => {
    setFilters((prev) => ({
      ...prev,
      benchmarks: prev.benchmarks.includes(benchmark)
        ? prev.benchmarks.filter((b) => b !== benchmark)
        : [...prev.benchmarks, benchmark],
    }));
  }, []);

  const setMinTasks = useCallback((minTasks: number) => {
    setFilters((prev) => ({ ...prev, minTasks }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

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
