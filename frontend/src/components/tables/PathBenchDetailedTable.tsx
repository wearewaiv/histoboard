"use client";

/**
 * PathBench Detailed Table
 *
 * Renders per-task results for the PathBench benchmark. Features 4 filter
 * dimensions: organs, grouped task categories (Survival → OS/DFS/DSS),
 * subcategories, and individual task IDs. Includes std values (mean ± std).
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "pathbench")
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ChevronDown } from "lucide-react";
import type { Model, Task } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetToggle } from "@/hooks";
import {
  useDetailedTableDataWithStd,
  type ResultWithStd,
} from "@/hooks/useDetailedTableData";

// Extract detailed task type from task name and category
function getDetailedTaskType(task: Task): string {
  if ((task.category as string).toLowerCase() === "classification") {
    return "Classification";
  }
  const name = task.name.toLowerCase();
  if (name.includes("overall survival")) return "OS";
  if (name.includes("disease-free survival")) return "DFS";
  if (name.includes("disease-specific survival")) return "DSS";
  return task.category as string;
}

// Format metric names for display
function formatPathBenchMetric(metric: string): string {
  const metricMap: Record<string, string> = {
    auc: "AUROC",
    auroc: "AUROC",
    "c-index": "C-Index",
  };
  return metricMap[metric.toLowerCase()] || metric.toUpperCase();
}

// Task category grouping: group DFS, DSS, OS into "Survival"
const TASK_CATEGORY_GROUPS: Record<string, string[]> = {
  Survival: ["OS", "DFS", "DSS"],
};

// Get grouped category label from detailed task type
function getGroupedCategory(detailedType: string): string {
  for (const [groupLabel, types] of Object.entries(TASK_CATEGORY_GROUPS)) {
    if (types.includes(detailedType)) return groupLabel;
  }
  return detailedType;
}

// Expand a grouped category to its underlying task types
function expandCategoryGroup(categoryLabel: string): string[] {
  return TASK_CATEGORY_GROUPS[categoryLabel] ?? [categoryLabel];
}

// Extract broader task category from full task name
function getTaskCategory(taskName: string): string {
  let category = taskName
    .replace(
      /\s*\((Internal|External\s+H\d+|Prospective\s+H\d+|External\s+H\d+\s+Biopsy)\)$/i,
      ""
    )
    .trim();
  category = category.replace(/\s*\(Biopsy\)$/i, "").trim();
  category = category.replace(/\s*\(\d+\s+classes\)$/i, "").trim();

  const normalizations: Record<string, string> = {
    "Histological Grade": "Histological Grading",
    "Regional Lymph Node Metastasis Prediction":
      "Regional Lymph Node Metastasis",
    "Tumor Invasion Depth Prediction": "Tumor Invasion Depth",
    "Lymph Node Metastasis Prediction": "Lymph Node Metastasis",
  };
  return normalizations[category] || category;
}

interface PathBenchDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: ResultWithStd[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function PathBenchDetailedTable({
  models,
  tasks,
  results,
}: PathBenchDetailedTableProps) {
  // Available filter values
  const availableOrgans = useMemo(
    () => [...new Set(tasks.map((t) => t.organ))].sort(),
    [tasks]
  );
  const taskCategories_grouped = useMemo(() => {
    const groupedSet = new Set<string>();
    for (const task of tasks) {
      groupedSet.add(getGroupedCategory(getDetailedTaskType(task)));
    }
    return [...groupedSet].sort();
  }, [tasks]);
  const taskCategories = useMemo(
    () => [...new Set(tasks.map((t) => getTaskCategory(t.name)))].sort(),
    [tasks]
  );
  const allTaskIds = useMemo(() => tasks.map((t) => t.id).sort(), [tasks]);
  const taskIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) map.set(task.id, task.name);
    return map;
  }, [tasks]);

  // Filter state via shared hook
  const organs = useSetToggle(availableOrgans);
  const types = useSetToggle(taskCategories_grouped);
  const subcategories = useSetToggle(taskCategories);
  const taskIds = useSetToggle(allTaskIds);
  const [searchQuery, setSearchQuery] = useState("");

  // Expand selected grouped categories to individual task types
  const expandedSelectedTypes = useMemo(() => {
    const expanded = new Set<string>();
    for (const categoryLabel of types.selected) {
      for (const detailedType of expandCategoryGroup(categoryLabel)) {
        expanded.add(detailedType);
      }
    }
    return expanded;
  }, [types.selected]);

  // Filter tasks (search overrides filters when active)
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    if (query) {
      const queryWords = query.split(/\s+/);
      filtered = tasks.filter((t) => {
        const searchableText = [
          t.name,
          t.organ,
          getDetailedTaskType(t),
          getTaskCategory(t.name),
        ]
          .join(" ")
          .toLowerCase();
        return queryWords.every((word) => searchableText.includes(word));
      });
    } else {
      filtered = tasks.filter(
        (t) =>
          organs.selected.has(t.organ) &&
          expandedSelectedTypes.has(getDetailedTaskType(t)) &&
          subcategories.selected.has(getTaskCategory(t.name)) &&
          taskIds.selected.has(t.id)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    tasks,
    organs.selected,
    expandedSelectedTypes,
    subcategories.selected,
    taskIds.selected,
    searchQuery,
  ]);

  // Shared data computation hook (with std support)
  const { resultsMap, taskStats, modelAvgRanks, modelAvgValues, sortedModels } =
    useDetailedTableDataWithStd({ models, filteredTasks, results });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={availableOrgans
            .map((organ) => ({
              id: organ,
              label: organ.charAt(0).toUpperCase() + organ.slice(1),
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={organs.selected}
          onToggle={organs.toggle}
          onSelectAll={organs.selectAll}
          onClearAll={organs.clearAll}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[140px]"
            >
              <span className="truncate">Task Type (1/1)</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Slide-level Classification</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <MultiSelectDropdown
          label="Task Categories"
          options={taskCategories_grouped
            .map((category) => ({ id: category, label: category }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={types.selected}
          onToggle={types.toggle}
          onSelectAll={types.selectAll}
          onClearAll={types.clearAll}
        />
        <MultiSelectDropdown
          label="Task Subcategories"
          options={taskCategories
            .map((category) => ({ id: category, label: category }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={subcategories.selected}
          onToggle={subcategories.toggle}
          onSelectAll={subcategories.selectAll}
          onClearAll={subcategories.clearAll}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={allTaskIds
            .map((id) => ({
              id: id,
              label: taskIdToName.get(id) || id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={taskIds.selected}
          onToggle={taskIds.toggle}
          onSelectAll={taskIds.selectAll}
          onClearAll={taskIds.clearAll}
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

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted">
              <th className="sticky left-0 z-30 bg-muted px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">
                  Average
                  <br />
                  rank
                </div>
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">
                  Average
                  <br />
                  metric
                </div>
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

              const hasResults = filteredTasks.some((task) =>
                modelResults?.has(task.id)
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
                    {modelAvgValues.get(model.id) !== undefined
                      ? formatNumber(modelAvgValues.get(model.id)!, 3)
                      : "-"}
                  </td>
                  {filteredTasks.map((task) => {
                    const result = modelResults?.get(task.id);
                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center",
                          result !== undefined &&
                            getValueColor(result.value, taskStats.get(task.id))
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
