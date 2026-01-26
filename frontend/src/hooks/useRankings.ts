"use client";

import { useMemo } from "react";
import type { Model, Task, Result, FilterState, ModelRanking } from "@/types";
import { computeModelRankings, filterResults } from "@/lib/ranking";

interface UseRankingsOptions {
  models: Model[];
  tasks: Task[];
  results: Result[];
  filters: FilterState;
}

export function useRankings({
  models,
  tasks,
  results,
  filters,
}: UseRankingsOptions): ModelRanking[] {
  return useMemo(() => {
    const filteredResults = filterResults(results, tasks, filters);
    return computeModelRankings(models, tasks, filteredResults);
  }, [models, tasks, results, filters]);
}
