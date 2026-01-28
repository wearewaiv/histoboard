"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Model, Task } from "@/types";
import { cn, formatNumber } from "@/lib/utils";

interface StanfordResult {
  modelId: string;
  taskId: string;
  value: number;
  balancedAccuracy?: number;
  source: string;
}

interface StanfordDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: StanfordResult[];
  modelRankings: { modelId: string; overallRank: number }[];
}

type MetricType = "auroc" | "balanced_accuracy";

export function StanfordDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: StanfordDetailedTableProps) {
  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(tasks.map((t) => t.category))].sort();
    return ["all", ...uniqueCategories];
  }, [tasks]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("auroc");

  // Filter tasks by selected category
  const filteredTasks = useMemo(() => {
    if (selectedCategory === "all") return tasks;
    return tasks.filter((t) => t.category === selectedCategory);
  }, [tasks, selectedCategory]);

  // Create a lookup map for results: modelId -> taskId -> { auroc, balancedAccuracy }
  const resultsMap = useMemo(() => {
    const map = new Map<string, Map<string, { auroc: number; balancedAccuracy?: number }>>();
    for (const result of results) {
      if (!map.has(result.modelId)) {
        map.set(result.modelId, new Map());
      }
      map.get(result.modelId)!.set(result.taskId, {
        auroc: result.value,
        balancedAccuracy: result.balancedAccuracy,
      });
    }
    return map;
  }, [results]);

  // Get min/max for each task for color scaling (based on selected metric)
  const taskStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();
    for (const task of filteredTasks) {
      const values: number[] = [];
      for (const result of results) {
        if (result.taskId === task.id) {
          const value = selectedMetric === "auroc"
            ? result.value
            : result.balancedAccuracy;
          if (value !== undefined) {
            values.push(value);
          }
        }
      }
      if (values.length > 0) {
        stats.set(task.id, {
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }
    return stats;
  }, [filteredTasks, results, selectedMetric]);

  // Compute average rank per model (across filtered tasks, using selected metric)
  const modelAvgRanks = useMemo(() => {
    const avgRanks = new Map<string, number>();

    // For each task, compute ranks
    const taskRanks = new Map<string, Map<string, number>>();
    for (const task of filteredTasks) {
      const taskResults = results
        .filter(r => r.taskId === task.id)
        .map(r => ({
          modelId: r.modelId,
          value: selectedMetric === "auroc" ? r.value : (r.balancedAccuracy ?? 0)
        }))
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
  }, [models, filteredTasks, results, selectedMetric]);

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
      {/* Metric toggle */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-medium">Metric:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMetric("auroc")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              selectedMetric === "auroc"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            AUROC
          </button>
          <button
            onClick={() => setSelectedMetric("balanced_accuracy")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              selectedMetric === "balanced_accuracy"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            Balanced Accuracy
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              selectedCategory === category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            {category === "all" ? "All" : category}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredTasks.length} tasks{selectedCategory !== "all" ? ` for "${selectedCategory}"` : ""}.
        Metric: {selectedMetric === "auroc" ? "AUROC" : "Balanced Accuracy"}.
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
                  title={task.name}
                >
                  <div className="text-xs truncate max-w-[120px]" title={task.name}>
                    {task.name.slice(0, 15)}{task.name.length > 15 ? "..." : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {selectedMetric === "auroc" ? "AUROC" : "Bal. Acc."}
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
                    const value = result
                      ? (selectedMetric === "auroc" ? result.auroc : result.balancedAccuracy)
                      : undefined;

                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums",
                          value !== undefined && getValueColor(value, task.id)
                        )}
                      >
                        {value !== undefined ? (
                          <span className="font-medium">
                            {formatNumber(value, 3)}
                          </span>
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
