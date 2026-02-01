"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

interface THUNDERDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

// Define which metrics are lower-is-better
const LOWER_IS_BETTER_TASKS = ["thunder_calibration", "thunder_adversarial"];

// Task type categories for THUNDER benchmark
const TASK_TYPES = [
  "Patch-level classification",
  "Calibration",
  "Robustness",
  "Segmentation",
] as const;

type TaskType = typeof TASK_TYPES[number];

// Get task type based on task ID
function getTaskType(taskId: string): TaskType {
  if (taskId === "thunder_calibration") return "Calibration";
  if (taskId === "thunder_adversarial") return "Robustness";
  if (taskId === "thunder_segmentation") return "Segmentation";
  return "Patch-level classification";
}

export function THUNDERDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: THUNDERDetailedTableProps) {
  // Get unique task types present in the data
  const taskTypes = useMemo(() => {
    const types = new Set(tasks.map((t) => getTaskType(t.id)));
    // Return in the order defined in TASK_TYPES
    return TASK_TYPES.filter((type) => types.has(type));
  }, [tasks]);

  // Get unique task names for filtering
  const taskNames = useMemo(() => {
    return [...new Set(tasks.map((t) => t.name))].sort();
  }, [tasks]);

  // Filter states - all selected by default
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(
    () => new Set(taskTypes)
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
    () => new Set(taskNames)
  );

  // Toggle helpers
  const toggleTaskType = (taskType: string) => {
    setSelectedTaskTypes((prev) => {
      const next = new Set(prev);
      if (next.has(taskType)) {
        next.delete(taskType);
      } else {
        next.add(taskType);
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

  // Filter tasks by selected task types AND selected task names
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        selectedTaskTypes.has(getTaskType(t.id)) &&
        selectedTasks.has(t.name)
    );
  }, [tasks, selectedTaskTypes, selectedTasks]);

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
    if (taskId === "thunder_calibration") {
      return formatNumber(value, 1) + "%"; // ECE as percentage
    }
    if (taskId === "thunder_adversarial") {
      return formatNumber(value, 1) + "%"; // Success rate as percentage
    }
    return formatNumber(value, 3); // Accuracy/Dice as decimal
  }

  // Get metric label for task
  function getMetricLabel(taskId: string): string {
    if (taskId === "thunder_calibration") return "ECE (%)";
    if (taskId === "thunder_adversarial") return "ASR (%)";
    if (taskId === "thunder_segmentation") return "Dice";
    return "Balanced accuracy";
  }

  // Build options for dropdowns
  const taskTypeOptions = taskTypes.map((type) => ({ id: type, label: type })).sort((a, b) => a.label.localeCompare(b.label));
  const taskOptions = taskNames.map((name) => ({ id: name, label: name })).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      {/* Benchmark description */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          <strong>THUNDER Benchmark</strong> (arXiv, 2025) comprehensively evaluates pathology foundation models across KNN classification,
          linear probing, few-shot learning, segmentation, calibration, and adversarial robustness tasks.
          Data sourced from the{" "}
          <a
            href="https://github.com/MICS-Lab/thunder/blob/main/docs/leaderboards.md#-up-to-date-rank-sum-leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            official THUNDER leaderboard
          </a>.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Task Type"
          options={taskTypeOptions}
          selectedIds={selectedTaskTypes}
          onToggle={toggleTaskType}
          onSelectAll={() => setSelectedTaskTypes(new Set(taskTypes))}
          onClearAll={() => setSelectedTaskTypes(new Set())}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={taskOptions}
          selectedIds={selectedTasks}
          onToggle={toggleTask}
          onSelectAll={() => setSelectedTasks(new Set(taskNames))}
          onClearAll={() => setSelectedTasks(new Set())}
        />
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredTasks.length} tasks.
        Rankings based on rank-sum across tasks. Lower calibration (ECE) and adversarial success rate (ASR) are better.
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted">
              <th className="sticky left-0 z-30 bg-muted px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">Rank<br />sum</div>
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
                          <span className="font-medium">{formatValue(value, task.id)}</span>
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
