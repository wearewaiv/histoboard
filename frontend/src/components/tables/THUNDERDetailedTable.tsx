"use client";

/**
 * THUNDER Benchmark Detailed Table
 *
 * Renders per-task results for the THUNDER benchmark (MICS Lab). Uses manual
 * data computation instead of useDetailedTableData because:
 * - Some metrics are lower-is-better (ECE for calibration, ASR for adversarial)
 * - Models are sorted by official rank sum (not computed average rank)
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "thunder")
 */

import React, { useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useSetToggle } from "@/hooks";

// Define which metrics are lower-is-better
const LOWER_IS_BETTER_TASKS = ["thunder_calibration", "thunder_adversarial"];

// Task type categories for THUNDER benchmark
const TASK_TYPES = [
  "Patch-level classification",
  "Calibration",
  "Robustness",
  "Segmentation",
] as const;

// Get task type based on task ID
function getTaskType(taskId: string): (typeof TASK_TYPES)[number] {
  if (taskId === "thunder_calibration") return "Calibration";
  if (taskId === "thunder_adversarial") return "Robustness";
  if (taskId === "thunder_segmentation") return "Segmentation";
  return "Patch-level classification";
}

interface THUNDERDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function THUNDERDetailedTable({
  models,
  tasks,
  results,
}: THUNDERDetailedTableProps) {
  // Available filter values
  const availableTaskTypes = useMemo(() => {
    const types = new Set(tasks.map((t) => getTaskType(t.id)));
    return TASK_TYPES.filter((type) => types.has(type));
  }, [tasks]);

  const availableTaskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  // Filter state via shared hook
  const taskTypes = useSetToggle<string>([...availableTaskTypes]);
  const taskNames = useSetToggle(availableTaskNames);

  // Filter tasks by selected task types AND selected task names
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          taskTypes.selected.has(getTaskType(t.id)) &&
          taskNames.selected.has(t.name)
      ),
    [tasks, taskTypes.selected, taskNames.selected]
  );

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

  // Get official rank sums from results data (thunder_ranksum task)
  const modelRankSums = useMemo(() => {
    const rankSums = new Map<string, number>();
    for (const result of results) {
      if (result.taskId === "thunder_ranksum") {
        rankSums.set(result.modelId, result.value);
      }
    }
    return rankSums;
  }, [results]);

  // Sort models by rank sum (lower is better)
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const rankA = modelRankSums.get(a.id) ?? 9999;
      const rankB = modelRankSums.get(b.id) ?? 9999;
      return rankA - rankB;
    });
  }, [models, modelRankSums]);

  // Get value color based on relative performance
  function getValueColor(value: number, taskId: string): string {
    const stats = taskStats.get(taskId);
    if (!stats || stats.max === stats.min) return "";

    let normalized = (value - stats.min) / (stats.max - stats.min);

    // For lower-is-better metrics, invert the normalization
    if (LOWER_IS_BETTER_TASKS.includes(taskId)) {
      normalized = 1 - normalized;
    }

    if (normalized >= 0.9) return "bg-emerald-100 text-emerald-800";
    if (normalized >= 0.7) return "bg-green-50 text-green-700";
    if (normalized >= 0.3) return "bg-gray-50";
    if (normalized >= 0.1) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  }

  // Format value with appropriate precision
  function formatValue(value: number, taskId: string): string {
    if (
      taskId === "thunder_calibration" ||
      taskId === "thunder_adversarial"
    ) {
      return formatNumber(value, 1) + "%";
    }
    return formatNumber(value, 3);
  }

  // Get metric label for task
  function getMetricLabel(taskId: string): string {
    if (taskId === "thunder_calibration") return "ECE (%)";
    if (taskId === "thunder_adversarial") return "ASR (%)";
    if (taskId === "thunder_segmentation") return "Dice";
    return "Balanced accuracy";
  }

  // Build options for dropdowns
  const taskTypeOptions = [...availableTaskTypes]
    .map((type) => ({ id: type, label: type }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const taskOptions = availableTaskNames
    .map((name) => ({ id: name, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Task Type"
          options={taskTypeOptions}
          selectedIds={taskTypes.selected}
          onToggle={taskTypes.toggle}
          onSelectAll={taskTypes.selectAll}
          onClearAll={taskTypes.clearAll}
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
                <div className="text-xs leading-tight">
                  Rank
                  <br />
                  sum
                </div>
              </th>
              {filteredTasks.map((task) => (
                <th
                  key={task.id}
                  className="px-2 py-2 text-center font-semibold min-w-[90px] max-w-[150px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {getMetricLabel(task.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const rankSum = modelRankSums.get(model.id);

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
                    {rankSum !== undefined ? rankSum : "-"}
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
                          <span className="font-medium">
                            {formatValue(value, task.id)}
                          </span>
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
