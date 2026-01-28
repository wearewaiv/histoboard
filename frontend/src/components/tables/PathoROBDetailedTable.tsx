"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber } from "@/lib/utils";

interface PathoROBDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function PathoROBDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: PathoROBDetailedTableProps) {
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
    for (const task of tasks) {
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
  }, [tasks, results]);

  // Compute average robustness index per model
  const modelAvgRobustness = useMemo(() => {
    const avgRobustness = new Map<string, number>();
    for (const model of models) {
      const modelResults = resultsMap.get(model.id);
      if (modelResults) {
        const values = Array.from(modelResults.values());
        if (values.length > 0) {
          avgRobustness.set(model.id, values.reduce((a, b) => a + b, 0) / values.length);
        }
      }
    }
    return avgRobustness;
  }, [models, resultsMap]);

  // Sort models by average robustness (higher is better)
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const robA = modelAvgRobustness.get(a.id) ?? 0;
      const robB = modelAvgRobustness.get(b.id) ?? 0;
      return robB - robA;
    });
  }, [models, modelAvgRobustness]);

  // Get value color based on relative performance (higher is better)
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
      <p className="mb-3 text-sm text-muted-foreground">
        Robustness Index values across {tasks.length} domain shift scenarios.
        Higher values indicate better robustness to distribution shifts.
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              {tasks.map((task) => (
                <th
                  key={task.id}
                  className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-[100px]"
                  title={task.name}
                >
                  <div className="text-xs">{task.name}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {task.organ}
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-[80px] bg-muted/80">
                <div className="text-xs">Average</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const avgRobustness = modelAvgRobustness.get(model.id);

              if (!modelResults || modelResults.size === 0) return null;

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
                  {tasks.map((task) => {
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
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {avgRobustness !== undefined ? formatNumber(avgRobustness, 3) : "-"}
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
