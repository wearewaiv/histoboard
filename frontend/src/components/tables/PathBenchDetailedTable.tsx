"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";

interface PathBenchResult extends Result {
  std?: number;
}

interface PathBenchDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: PathBenchResult[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function PathBenchDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: PathBenchDetailedTableProps) {
  // Get unique organs for filtering
  const organs = useMemo(() => {
    const uniqueOrgans = [...new Set(tasks.map((t) => t.organ))].sort();
    return ["all", ...uniqueOrgans];
  }, [tasks]);

  const [selectedOrgan, setSelectedOrgan] = useState<string>(organs[1] || "all");

  // Filter tasks by selected organ
  const filteredTasks = useMemo(() => {
    if (selectedOrgan === "all") return tasks;
    return tasks.filter((t) => t.organ === selectedOrgan);
  }, [tasks, selectedOrgan]);

  // Create a lookup map for results: modelId -> taskId -> { value, std }
  const resultsMap = useMemo(() => {
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
  }, [results]);

  // Get min/max for each task for color scaling
  const taskStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();
    for (const task of filteredTasks) {
      const values = results
        .filter((r) => r.taskId === task.id)
        .map((r) => r.value);
      if (values.length > 0) {
        stats.set(task.id, {
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }
    return stats;
  }, [filteredTasks, results]);

  // Compute average rank per model (across filtered tasks)
  const modelAvgRanks = useMemo(() => {
    const avgRanks = new Map<string, number>();

    // For each task, compute ranks
    const taskRanks = new Map<string, Map<string, number>>();
    for (const task of filteredTasks) {
      const taskResults = results
        .filter(r => r.taskId === task.id)
        .sort((a, b) => b.value - a.value); // Higher is better

      const ranks = new Map<string, number>();
      taskResults.forEach((r, idx) => {
        ranks.set(r.modelId, idx + 1);
      });
      taskRanks.set(task.id, ranks);
    }

    // Compute average rank per model
    for (const model of models) {
      const ranks: number[] = [];
      for (const task of filteredTasks) {
        const rank = taskRanks.get(task.id)?.get(model.id);
        if (rank !== undefined) {
          ranks.push(rank);
        }
      }
      if (ranks.length > 0) {
        avgRanks.set(model.id, ranks.reduce((a, b) => a + b, 0) / ranks.length);
      }
    }

    return avgRanks;
  }, [models, filteredTasks, results]);

  // Sort models by average rank
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const rankA = modelAvgRanks.get(a.id) ?? 999;
      const rankB = modelAvgRanks.get(b.id) ?? 999;
      return rankA - rankB;
    });
  }, [models, modelAvgRanks]);

  // Get value color based on relative performance
  function getValueColor(value: number, taskId: string): string {
    const stats = taskStats.get(taskId);
    if (!stats || stats.max === stats.min) return "";

    const normalized = (value - stats.min) / (stats.max - stats.min);

    if (normalized >= 0.9) return "bg-emerald-100 text-emerald-800";
    if (normalized >= 0.7) return "bg-green-50 text-green-700";
    if (normalized >= 0.3) return "bg-gray-50";
    if (normalized >= 0.1) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  }

  return (
    <div>
      {/* Organ filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {organs.map((organ) => (
          <button
            key={organ}
            onClick={() => setSelectedOrgan(organ)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors capitalize",
              selectedOrgan === organ
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            {organ === "all" ? "All" : organ}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredTasks.length} tasks{selectedOrgan !== "all" ? ` for ${selectedOrgan}` : ""}. Values show mean ± std over 10 folds.
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              {filteredTasks.map((task) => (
                <th
                  key={task.id}
                  className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-[100px]"
                  title={`${task.name} (${task.metric.toUpperCase()})`}
                >
                  <div className="text-xs truncate max-w-[120px]" title={task.name}>
                    {task.name.replace(` (${task.organ})`, "").slice(0, 20)}
                    {task.name.length > 20 ? "..." : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {task.metric.toUpperCase()}
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-[80px] bg-muted/80">
                <div className="text-xs">Avg Rank</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const avgRank = modelAvgRanks.get(model.id);

              // Check if model has any results for filtered tasks
              const hasResults = filteredTasks.some(
                (task) => modelResults?.has(task.id)
              );
              if (!hasResults) return null;

              return (
                <tr
                  key={model.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-background px-3 py-2 border-r">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {sortIdx + 1}
                      </span>
                      <Link
                        href={`/models/${model.id}`}
                        className="font-medium text-primary hover:underline whitespace-nowrap"
                      >
                        {model.name}
                      </Link>
                    </div>
                  </td>
                  {filteredTasks.map((task) => {
                    const result = modelResults?.get(task.id);
                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center",
                          result !== undefined && getValueColor(result.value, task.id)
                        )}
                      >
                        {result !== undefined ? (
                          <div className="tabular-nums">
                            <span className="font-medium">
                              {formatNumber(result.value, 3)}
                            </span>
                            {result.std !== undefined && result.std > 0 && (
                              <span className="text-muted-foreground text-[10px] ml-0.5">
                                ±{formatNumber(result.std, 3)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {avgRank !== undefined ? formatNumber(avgRank, 2) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
