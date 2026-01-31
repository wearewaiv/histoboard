"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

interface PathBenchResult extends Result {
  std?: number;
}

interface PathBenchDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: PathBenchResult[];
  modelRankings: { modelId: string; overallRank: number }[];
}

// Extract detailed task type from task name and category
// Returns: Classification, OS (Overall Survival), DFS (Disease-free Survival), or DSS (Disease-specific Survival)
function getDetailedTaskType(task: Task): string {
  if (task.category === "Classification") {
    return "Classification";
  }
  // For survival tasks, determine the specific type from the task name
  const name = task.name.toLowerCase();
  if (name.includes("overall survival")) {
    return "OS";
  }
  if (name.includes("disease-free survival")) {
    return "DFS";
  }
  if (name.includes("disease-specific survival")) {
    return "DSS";
  }
  // Default to the original category if we can't determine
  return task.category as string;
}

// Format metric names for display
function formatPathBenchMetric(metric: string): string {
  const metricMap: Record<string, string> = {
    "auc": "AUROC",
    "auroc": "AUROC",
    "c-index": "C-Index",
  };
  return metricMap[metric.toLowerCase()] || metric.toUpperCase();
}

// Map detailed task type to display label
const TASK_TYPE_LABELS: Record<string, string> = {
  "Classification": "Classification",
  "OS": "OS (Overall Survival)",
  "DFS": "DFS (Disease-free Survival)",
  "DSS": "DSS (Disease-specific Survival)",
};

// Extract broader task category from full task name
// e.g., "Histological Grading (Biopsy) (Internal)" → "Histological Grading"
// e.g., "Regional Lymph Node Metastasis (External H9)" → "Regional Lymph Node Metastasis"
function getTaskCategory(taskName: string): string {
  // Remove data source suffix: (Internal), (External H...), (Prospective H...), (External H1 Biopsy)
  let category = taskName
    .replace(/\s*\((Internal|External\s+H\d+|Prospective\s+H\d+|External\s+H\d+\s+Biopsy)\)$/i, "")
    .trim();

  // Remove (Biopsy) modifier to group with non-biopsy tasks
  category = category.replace(/\s*\(Biopsy\)$/i, "").trim();

  // Remove class count variations: (2 classes), (3 classes), (4 classes)
  category = category.replace(/\s*\(\d+\s+classes\)$/i, "").trim();

  // Normalize similar names
  const normalizations: Record<string, string> = {
    "Histological Grade": "Histological Grading",
    "Regional Lymph Node Metastasis Prediction": "Regional Lymph Node Metastasis",
    "Tumor Invasion Depth Prediction": "Tumor Invasion Depth",
    "Lymph Node Metastasis Prediction": "Lymph Node Metastasis",
  };

  return normalizations[category] || category;
}

export function PathBenchDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: PathBenchDetailedTableProps) {
  // Get unique organs for filtering
  const organs = useMemo(() => {
    return [...new Set(tasks.map((t) => t.organ))].sort();
  }, [tasks]);

  // Get unique task types for filtering (Classification, OS, DFS, DSS)
  const taskTypes = useMemo(() => {
    return [...new Set(tasks.map((t) => getDetailedTaskType(t)))].sort();
  }, [tasks]);

  // Get unique task categories for filtering (broader groupings from task names)
  const taskCategories = useMemo(() => {
    return [...new Set(tasks.map((t) => getTaskCategory(t.name)))].sort();
  }, [tasks]);

  // Get all task IDs for filtering (all 229 individual tasks)
  const allTaskIds = useMemo(() => {
    return tasks.map((t) => t.id).sort();
  }, [tasks]);

  // Create a map of task ID to task name for display
  const taskIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      map.set(task.id, task.name);
    }
    return map;
  }, [tasks]);

  // Filter states
  const [selectedOrgans, setSelectedOrgans] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set<string>()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const initializedRef = useRef(false);

  // Initialize selected values when options become available (only once)
  useEffect(() => {
    if (!initializedRef.current && organs.length > 0 && taskTypes.length > 0 && taskCategories.length > 0 && allTaskIds.length > 0) {
      setSelectedOrgans(new Set(organs));
      setSelectedTypes(new Set(taskTypes));
      setSelectedCategories(new Set(taskCategories));
      setSelectedTaskIds(new Set(allTaskIds));
      initializedRef.current = true;
    }
  }, [organs, taskTypes, taskCategories, allTaskIds]);

  // Toggle helpers
  const toggleOrgan = (organ: string) => {
    setSelectedOrgans((prev) => {
      const next = new Set(prev);
      if (next.has(organ)) {
        next.delete(organ);
      } else {
        next.add(organ);
      }
      return next;
    });
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

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

  const toggleTaskId = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Filter tasks by selected organs, task types, task categories, tasks, and search query
  // When there's a search query, it searches across ALL tasks (ignoring filters)
  // Sort alphabetically by task name
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    // If there's a search query, search across all tasks
    // All query words must be present in the searchable text
    if (query) {
      const queryWords = query.split(/\s+/);
      filtered = tasks.filter((t) => {
        const searchableText = [
          t.name,
          t.organ,
          getDetailedTaskType(t),
          getTaskCategory(t.name),
        ].join(" ").toLowerCase();
        return queryWords.every((word) => searchableText.includes(word));
      });
    } else {
      // Otherwise, apply all filters
      filtered = tasks.filter((t) =>
        selectedOrgans.has(t.organ) &&
        selectedTypes.has(getDetailedTaskType(t)) &&
        selectedCategories.has(getTaskCategory(t.name)) &&
        selectedTaskIds.has(t.id)
      );
    }

    // Sort alphabetically by task name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, selectedOrgans, selectedTypes, selectedCategories, selectedTaskIds, searchQuery]);

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
        const result = resultsMap.get(model.id)?.get(task.id);
        if (result !== undefined) {
          values.push(result.value);
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
          <strong>PathBench</strong> (arXiv, 2025) is a large-scale benchmark for pathology foundation models across 229 tasks
          including classification, overall survival (OS), disease-free survival (DFS), and disease-specific survival (DSS)
          prediction. Data sourced from the{" "}
          <a
            href="https://github.com/birkhoffkiki/PathBench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            official PathBench GitHub
          </a>.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={organs
            .map((organ) => ({
              id: organ,
              label: organ.charAt(0).toUpperCase() + organ.slice(1),
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedOrgans}
          onToggle={toggleOrgan}
          onSelectAll={() => setSelectedOrgans(new Set(organs))}
          onClearAll={() => setSelectedOrgans(new Set())}
        />
        <MultiSelectDropdown
          label="Task Categories"
          options={taskTypes
            .map((type) => ({
              id: type,
              label: TASK_TYPE_LABELS[type] || type,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedTypes}
          onToggle={toggleType}
          onSelectAll={() => setSelectedTypes(new Set(taskTypes))}
          onClearAll={() => setSelectedTypes(new Set())}
        />
        <MultiSelectDropdown
          label="Task Subcategories"
          options={taskCategories
            .map((category) => ({
              id: category,
              label: category,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onSelectAll={() => setSelectedCategories(new Set(taskCategories))}
          onClearAll={() => setSelectedCategories(new Set())}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={allTaskIds
            .map((id) => ({
              id: id,
              label: taskIdToName.get(id) || id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedTaskIds}
          onToggle={toggleTaskId}
          onSelectAll={() => setSelectedTaskIds(new Set(allTaskIds))}
          onClearAll={() => setSelectedTaskIds(new Set())}
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
        Showing {filteredTasks.length} tasks. Values show mean ± std over 10 folds.
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
                  className="px-2 py-2 text-center font-semibold min-w-[120px] max-w-[200px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {formatPathBenchMetric(task.metric)}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
