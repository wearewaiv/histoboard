"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

// Format metric names for display
function formatMetricName(metric: string): string {
  const metricMap: Record<string, string> = {
    "auc": "AUROC",
    "auroc": "AUROC",
    "balanced_accuracy": "Balanced Accuracy",
    "balanced_acc": "Balanced Accuracy",
    "c-index": "C-Index",
    "c_index": "C-Index",
    "kappa": "Kappa",
  };
  return metricMap[metric.toLowerCase()] || metric;
}

interface PathoBenchDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function PathoBenchDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: PathoBenchDetailedTableProps) {
  // Get unique categories for filtering
  const categories = useMemo(() => {
    return [...new Set(tasks.map((t) => t.category as string))].sort();
  }, [tasks]);

  // Get unique task names for filtering
  const taskNames = useMemo(() => {
    return [...new Set(tasks.map((t) => t.name))].sort();
  }, [tasks]);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(categories)
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
    () => new Set(taskNames)
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle helpers
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleTask = (taskName: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskName)) {
        next.delete(taskName);
      } else {
        next.add(taskName);
      }
      return next;
    });
  };

  // Filter tasks by selected categories, selected task names, and search query
  // When there's a search query, it searches across ALL tasks (ignoring filters)
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    // If there's a search query, search across all tasks
    if (query) {
      filtered = tasks.filter((t) =>
        t.name.toLowerCase().includes(query) ||
        (t.category as string).toLowerCase().includes(query) ||
        t.metric.toLowerCase().includes(query)
      );
    } else {
      // Otherwise, apply all filters
      filtered = tasks.filter(
        (t) => selectedCategories.has(t.category as string) && selectedTasks.has(t.name)
      );
    }

    // Sort alphabetically by task name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, selectedCategories, selectedTasks, searchQuery]);

  // Create a lookup map for results: modelId -> taskId -> value
  const resultsMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const result of results) {
      if (!map.has(result.modelId)) {
        map.set(result.modelId, new Map());
      }
      map.get(result.modelId)!.set(result.taskId, result.value);
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
        .filter((r) => r.taskId === task.id)
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

  // Compute average metric value per model (across filtered tasks)
  const modelAvgValues = useMemo(() => {
    const avgValues = new Map<string, number>();

    for (const model of models) {
      const values: number[] = [];
      for (const task of filteredTasks) {
        const value = resultsMap.get(model.id)?.get(task.id);
        if (value !== undefined) {
          values.push(value);
        }
      }
      if (values.length > 0) {
        avgValues.set(model.id, values.reduce((a, b) => a + b, 0) / values.length);
      }
    }

    return avgValues;
  }, [models, filteredTasks, resultsMap]);

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
      {/* Benchmark description */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          <strong>Patho-Bench</strong> is a standardized benchmark suite from the Mahmood Lab for evaluating pathology
          foundation models, featuring 41 weakly-supervised slide classification tasks for biomarker and outcome prediction
          across 9 cancer types. See the{" "}
          <a
            href="https://github.com/mahmoodlab/Patho-Bench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            official Patho-Bench GitHub
          </a>{" "}
          for details.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          ⚠️ <strong>Note:</strong> Results shown here are retrieved from Table 2 of the{" "}
          <a
            href="https://arxiv.org/html/2601.05148"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Atlas 2 preprint
          </a>, not from the official Patho-Bench benchmark release.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Task Category"
          options={categories
            .map((category) => ({
              id: category,
              label: category,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onSelectAll={() => setSelectedCategories(new Set(categories))}
          onClearAll={() => setSelectedCategories(new Set())}
        />
        <MultiSelectDropdown
          label="Tasks"
          options={taskNames
            .map((taskName) => ({
              id: taskName,
              label: taskName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedTasks}
          onToggle={toggleTask}
          onSelectAll={() => setSelectedTasks(new Set(taskNames))}
          onClearAll={() => setSelectedTasks(new Set())}
        />
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredTasks.length} tasks.
        Values are shown as decimals (e.g., 0.836 = 83.6%).
      </p>

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted">
              <th className="sticky left-0 z-30 bg-muted px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">Average<br />rank</div>
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">Average<br />metric</div>
              </th>
              {filteredTasks.map((task) => (
                <th
                  key={task.id}
                  className="px-2 py-2 text-center font-semibold min-w-[80px] max-w-[150px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {formatMetricName(task.metric)}
                  </div>
                </th>
              ))}
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
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {avgRank !== undefined ? formatNumber(avgRank, 2) : "-"}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {modelAvgValues.get(model.id) !== undefined ? formatNumber(modelAvgValues.get(model.id)!, 3) : "-"}
                  </td>
                  {filteredTasks.map((task) => {
                    const value = modelResults?.get(task.id);
                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums",
                          value !== undefined && getValueColor(value, task.id)
                        )}
                      >
                        {value !== undefined ? (
                          <span className="font-medium">{formatNumber(value, 3)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
