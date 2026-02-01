"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber, formatMetricLabel, formatOrganLabel } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Model, Task, Benchmark } from "@/types";

interface ArenaComparisonTableProps {
  selectedModels: Model[];
  filteredTasks: Task[];  // Tasks where ALL selected models have results
  allFilteredTasks: Task[];  // All tasks matching filters (before model coverage filter)
  resultsMap: Map<string, Map<string, number>>;
  benchmarks: Benchmark[];
}

export function ArenaComparisonTable({
  selectedModels,
  filteredTasks,
  allFilteredTasks,
  resultsMap,
  benchmarks,
}: ArenaComparisonTableProps) {
  // Group tasks by benchmark
  const tasksByBenchmark = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      if (!groups.has(task.benchmarkId)) {
        groups.set(task.benchmarkId, []);
      }
      groups.get(task.benchmarkId)!.push(task);
    }
    // Sort tasks within each benchmark
    for (const [, tasks] of groups) {
      tasks.sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [filteredTasks]);

  // Count tasks per benchmark from ALL filtered tasks (before model coverage filter)
  const allTaskCountByBenchmark = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of allFilteredTasks) {
      counts.set(task.benchmarkId, (counts.get(task.benchmarkId) || 0) + 1);
    }
    return counts;
  }, [allFilteredTasks]);

  // Get benchmarks that have tasks
  const activeBenchmarks = useMemo(() => {
    return benchmarks
      .filter((b) => tasksByBenchmark.has(b.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [benchmarks, tasksByBenchmark]);

  // Compute which benchmarks should be collapsed by default
  // (those where some tasks were excluded because not all models have results)
  const defaultCollapsedBenchmarks = useMemo(() => {
    const collapsed = new Set<string>();
    for (const benchmark of activeBenchmarks) {
      const commonTaskCount = tasksByBenchmark.get(benchmark.id)?.length || 0;
      const allTaskCount = allTaskCountByBenchmark.get(benchmark.id) || 0;
      // Collapse if this benchmark has fewer tasks after the "all models" filter
      if (commonTaskCount < allTaskCount) {
        collapsed.add(benchmark.id);
      }
    }
    return collapsed;
  }, [activeBenchmarks, tasksByBenchmark, allTaskCountByBenchmark]);

  // Collapsed state for benchmarks
  const [collapsedBenchmarks, setCollapsedBenchmarks] = useState<Set<string>>(new Set());

  // Update collapsed state when models/tasks change
  useEffect(() => {
    setCollapsedBenchmarks(defaultCollapsedBenchmarks);
  }, [defaultCollapsedBenchmarks]);

  const toggleBenchmark = (benchmarkId: string) => {
    setCollapsedBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(benchmarkId)) {
        next.delete(benchmarkId);
      } else {
        next.add(benchmarkId);
      }
      return next;
    });
  };

  // Compute per-task ranks among selected models
  const taskRanks = useMemo(() => {
    const ranks = new Map<string, Map<string, number>>();
    const selectedIds = selectedModels.map((m) => m.id);

    for (const task of filteredTasks) {
      const taskResults = selectedIds
        .map((modelId) => ({
          modelId,
          value: resultsMap.get(modelId)?.get(task.id),
        }))
        .filter((r) => r.value !== undefined)
        .sort((a, b) => b.value! - a.value!);

      const taskRankMap = new Map<string, number>();
      taskResults.forEach((r, idx) => {
        taskRankMap.set(r.modelId, idx + 1);
      });
      ranks.set(task.id, taskRankMap);
    }

    return ranks;
  }, [filteredTasks, selectedModels, resultsMap]);

  // Sort models by overall average rank (best to worst, left to right)
  const sortedModels = useMemo(() => {
    // Compute overall average rank for each model
    const modelAvgRanks = new Map<string, number>();
    for (const model of selectedModels) {
      const ranks: number[] = [];
      for (const task of filteredTasks) {
        const rank = taskRanks.get(task.id)?.get(model.id);
        if (rank !== undefined) ranks.push(rank);
      }
      if (ranks.length > 0) {
        modelAvgRanks.set(model.id, ranks.reduce((a, b) => a + b, 0) / ranks.length);
      }
    }

    // Sort by average rank (lower is better)
    return [...selectedModels].sort((a, b) => {
      const rankA = modelAvgRanks.get(a.id) ?? 999;
      const rankB = modelAvgRanks.get(b.id) ?? 999;
      return rankA - rankB;
    });
  }, [selectedModels, filteredTasks, taskRanks]);

  // Compute per-benchmark stats for each model
  const benchmarkStats = useMemo(() => {
    const stats = new Map<string, Map<string, { avgRank: number; avgValue: number; taskCount: number }>>();

    for (const benchmark of activeBenchmarks) {
      const benchmarkTasks = tasksByBenchmark.get(benchmark.id) || [];
      const modelStats = new Map<string, { avgRank: number; avgValue: number; taskCount: number }>();

      for (const model of sortedModels) {
        const ranks: number[] = [];
        const values: number[] = [];

        for (const task of benchmarkTasks) {
          const rank = taskRanks.get(task.id)?.get(model.id);
          const value = resultsMap.get(model.id)?.get(task.id);

          if (rank !== undefined) ranks.push(rank);
          if (value !== undefined) values.push(value);
        }

        if (ranks.length > 0) {
          modelStats.set(model.id, {
            avgRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
            avgValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            taskCount: ranks.length,
          });
        }
      }

      stats.set(benchmark.id, modelStats);
    }

    return stats;
  }, [activeBenchmarks, tasksByBenchmark, selectedModels, taskRanks, resultsMap]);

  // Get cell color based on rank
  function getRankColor(rank: number, totalModels: number): string {
    if (totalModels <= 1) return "";
    if (rank === 1) return "bg-emerald-100 text-emerald-800";
    if (rank === totalModels) return "bg-red-50 text-red-700";
    return "";
  }

  // Expand/collapse all
  const expandAll = () => setCollapsedBenchmarks(new Set());
  const collapseAll = () => setCollapsedBenchmarks(new Set(activeBenchmarks.map((b) => b.id)));

  if (activeBenchmarks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tasks match the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Detailed Comparison</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Expand all
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Collapse all
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="border-b bg-muted">
                <th className="sticky left-0 z-30 bg-muted px-4 py-3 text-left font-semibold min-w-[200px]">
                  Task
                </th>
                {sortedModels.map((model) => (
                  <th
                    key={model.id}
                    className="px-3 py-3 text-center font-semibold min-w-[120px]"
                  >
                    <div className="text-xs leading-tight">{model.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeBenchmarks.map((benchmark) => {
                const benchmarkTasks = tasksByBenchmark.get(benchmark.id) || [];
                const isCollapsed = collapsedBenchmarks.has(benchmark.id);
                const bStats = benchmarkStats.get(benchmark.id);

                return (
                  <React.Fragment key={benchmark.id}>
                    {/* Benchmark header row (always visible) */}
                    <tr
                      className="bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                      onClick={() => toggleBenchmark(benchmark.id)}
                    >
                      <td className="sticky left-0 z-10 bg-muted/50 px-4 py-3 font-semibold border-t border-b">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span>{benchmark.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({benchmarkTasks.length} tasks)
                          </span>
                        </div>
                      </td>
                      {sortedModels.map((model) => {
                        const stats = bStats?.get(model.id);
                        return (
                          <td
                            key={model.id}
                            className="px-3 py-3 text-center border-t border-b bg-muted/50"
                          >
                            {stats ? (
                              <div className="text-xs font-semibold">
                                {formatNumber(stats.avgRank, 2)} avg rank
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Task rows (collapsible) */}
                    {!isCollapsed &&
                      benchmarkTasks.map((task) => {
                        const taskRankMap = taskRanks.get(task.id);

                        return (
                          <tr
                            key={task.id}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="sticky left-0 z-10 bg-background px-4 py-2 pl-10">
                              <div className="text-sm">{task.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatOrganLabel(task.organ)} | {formatMetricLabel(task.metric)}
                              </div>
                            </td>
                            {sortedModels.map((model) => {
                              const value = resultsMap.get(model.id)?.get(task.id);
                              const rank = taskRankMap?.get(model.id);

                              return (
                                <td
                                  key={model.id}
                                  className={cn(
                                    "px-3 py-2 text-center tabular-nums",
                                    rank !== undefined && getRankColor(rank, sortedModels.length)
                                  )}
                                >
                                  {value !== undefined ? (
                                    <div>
                                      <span className="font-medium">
                                        {formatNumber(value, 3)}
                                      </span>
                                      {rank !== undefined && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                          (#{rank})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
