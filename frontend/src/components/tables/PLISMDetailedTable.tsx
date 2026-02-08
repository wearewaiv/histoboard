"use client";

/**
 * PLISM Benchmark Detailed Table
 *
 * Renders per-task results for the Plismbench robustness benchmark (Owkin).
 * No organ filter dimension — only task categories and names.
 * Sorted by average value (descending) rather than average rank.
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "plism")
 */

import React, { useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetToggle } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

interface PLISMDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function PLISMDetailedTable({
  models,
  tasks,
  results,
}: PLISMDetailedTableProps) {
  // Available filter values
  const availableCategories = useMemo(
    () => [...new Set(tasks.map((t) => t.category as string))].sort(),
    [tasks]
  );
  const availableTaskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  // Filter state via shared hook
  const categories = useSetToggle(availableCategories);
  const taskNames = useSetToggle(availableTaskNames);

  // Filter tasks by selected categories AND selected task names
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          categories.selected.has(t.category as string) &&
          taskNames.selected.has(t.name)
      ),
    [tasks, categories.selected, taskNames.selected]
  );

  // Shared data computation hook
  const { resultsMap, taskStats, modelAvgRanks, modelAvgValues } =
    useDetailedTableData({ models, filteredTasks, results });

  // Custom sort: by leaderboard score (avgValue, higher is better)
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const scoreA = modelAvgValues.get(a.id) ?? 0;
      const scoreB = modelAvgValues.get(b.id) ?? 0;
      return scoreB - scoreA;
    });
  }, [models, modelAvgValues]);

  // Build dropdown options
  const categoryOptions = availableCategories
    .map((cat) => ({ id: cat, label: cat }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const taskOptions = availableTaskNames
    .map((name) => ({ id: name, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={categoryOptions}
          selectedIds={categories.selected}
          onToggle={categories.toggle}
          onSelectAll={categories.selectAll}
          onClearAll={categories.clearAll}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[140px]">
              <span className="truncate">Task Type (1/1)</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Robustness
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                  className="px-2 py-2 text-center font-semibold min-w-[120px] max-w-[180px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {task.category}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const leaderboardScore = modelAvgValues.get(model.id);

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
                    {modelAvgRanks.get(model.id) !== undefined
                      ? formatNumber(modelAvgRanks.get(model.id)!, 2)
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {leaderboardScore !== undefined
                      ? formatNumber(leaderboardScore, 3)
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
