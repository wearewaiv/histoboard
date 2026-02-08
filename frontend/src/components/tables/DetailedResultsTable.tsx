"use client";

/**
 * EVA Benchmark Detailed Table
 *
 * Renders per-task results for the EVA benchmark (kaiko.ai). Filters by organ,
 * task type, and task name. Excludes BACH from the average metric column because
 * BACH uses a different evaluation protocol than the other EVA tasks.
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "eva")
 */

import React, { useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useTaskFiltering } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

// Get metric display for EVA tasks
// All EVA metrics are balanced accuracy except Dice for segmentation tasks (CoNSeP, MoNuSAC)
function getEvaMetricDisplay(taskName: string): string {
  const name = taskName.toLowerCase();
  if (name.includes("consep") || name.includes("monusac")) {
    return "Dice";
  }
  return "Balanced Accuracy";
}

// Get user-friendly label for task type/category
function getTaskTypeLabel(category: string): string {
  const labels: Record<string, string> = {
    "patch-level": "Patch-level classification",
    "slide-level": "Slide-level classification",
    segmentation: "Segmentation",
    classification: "Classification",
    survival: "Survival",
  };
  return labels[category] || category;
}

interface DetailedResultsTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function DetailedResultsTable({
  models,
  tasks,
  results,
}: DetailedResultsTableProps) {
  // Shared filter hook (organs + categories + task names, no search)
  const {
    filteredTasks,
    organs,
    categories,
    taskNames,
    availableOrgans,
    availableCategories,
    availableTaskNames,
  } = useTaskFiltering(tasks);

  // Shared data computation hook
  const { resultsMap, taskStats, modelAvgRanks, sortedModels } =
    useDetailedTableData({ models, filteredTasks, results });

  // Custom average metric: exclude BACH task from average calculation
  const modelAvgValues = useMemo(() => {
    const avgValues = new Map<string, number>();

    for (const model of models) {
      const values: number[] = [];
      for (const task of filteredTasks) {
        if (task.name.toLowerCase().includes("bach")) continue;
        const value = resultsMap.get(model.id)?.get(task.id)?.value;
        if (value !== undefined) {
          values.push(value);
        }
      }
      if (values.length > 0) {
        avgValues.set(
          model.id,
          values.reduce((a, b) => a + b, 0) / values.length
        );
      }
    }

    return avgValues;
  }, [models, filteredTasks, resultsMap]);

  // Build dropdown options
  const organOptions = availableOrgans
    .map((organ) => ({
      id: organ,
      label: organ.charAt(0).toUpperCase() + organ.slice(1),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryOptions = availableCategories
    .map((category) => ({
      id: category,
      label: getTaskTypeLabel(category),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const taskOptions = availableTaskNames
    .map((taskName) => ({ id: taskName, label: taskName }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={organOptions}
          selectedIds={organs.selected}
          onToggle={organs.toggle}
          onSelectAll={organs.selectAll}
          onClearAll={organs.clearAll}
        />
        <MultiSelectDropdown
          label="Task Type"
          options={categoryOptions}
          selectedIds={categories.selected}
          onToggle={categories.toggle}
          onSelectAll={categories.selectAll}
          onClearAll={categories.clearAll}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={taskOptions}
          selectedIds={taskNames.selected}
          onToggle={taskNames.toggle}
          onSelectAll={taskNames.selectAll}
          onClearAll={taskNames.clearAll}
        />
      </div>

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
                  className="px-2 py-2 text-center font-semibold min-w-[100px] max-w-[150px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {getEvaMetricDisplay(task.name)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const avgRank = modelAvgRanks.get(model.id);

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
                    {modelAvgValues.get(model.id) !== undefined
                      ? formatNumber(modelAvgValues.get(model.id)!, 3)
                      : "-"}
                  </td>
                  {filteredTasks.map((task) => {
                    const value = modelResults?.get(task.id)?.value;
                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums",
                          value !== undefined &&
                            getValueColor(value, taskStats.get(task.id))
                        )}
                      >
                        {value !== undefined ? formatNumber(value, 3) : "-"}
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
