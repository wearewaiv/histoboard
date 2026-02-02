"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetToggle } from "@/hooks";
import {
  buildResultsMap,
  computeTaskStats,
  computeTaskRanks,
  computeModelAverageRanks,
  computeModelAverageValues,
} from "@/types/results";

interface HESTDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function HESTDetailedTable({
  models,
  tasks,
  results,
}: HESTDetailedTableProps) {
  // Extract unique filter options
  const organs = useMemo(
    () => [...new Set(tasks.map((t) => t.organ))].sort(),
    [tasks]
  );
  const taskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  // Filter state using shared hook
  const organFilter = useSetToggle(organs);
  const taskFilter = useSetToggle(taskNames);

  // Filter tasks by selected organs AND selected task names
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) => organFilter.selected.has(t.organ) && taskFilter.selected.has(t.name)
      ),
    [tasks, organFilter.selected, taskFilter.selected]
  );

  // Build lookup maps using shared utilities
  const resultsMap = useMemo(() => buildResultsMap(results), [results]);

  const filteredTaskIds = useMemo(
    () => filteredTasks.map((t) => t.id),
    [filteredTasks]
  );

  const taskStats = useMemo(
    () => computeTaskStats(results, filteredTaskIds),
    [results, filteredTaskIds]
  );

  // Compute rankings using shared utilities
  const taskRanks = useMemo(
    () => computeTaskRanks(results, true),
    [results]
  );

  const modelIds = useMemo(() => models.map((m) => m.id), [models]);

  const modelAvgRanks = useMemo(
    () => computeModelAverageRanks(taskRanks, modelIds, filteredTaskIds),
    [taskRanks, modelIds, filteredTaskIds]
  );

  const modelAvgValues = useMemo(
    () => computeModelAverageValues(resultsMap, modelIds, filteredTaskIds),
    [resultsMap, modelIds, filteredTaskIds]
  );

  // Sort models by average rank
  const sortedModels = useMemo(
    () =>
      [...models].sort((a, b) => {
        const rankA = modelAvgRanks.get(a.id) ?? 999;
        const rankB = modelAvgRanks.get(b.id) ?? 999;
        return rankA - rankB;
      }),
    [models, modelAvgRanks]
  );

  // Dropdown options for organs filter
  const organOptions = useMemo(
    () =>
      organs
        .map((organ) => ({
          id: organ,
          label: organ.charAt(0).toUpperCase() + organ.slice(1),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [organs]
  );

  // Dropdown options for tasks filter
  const taskOptions = useMemo(
    () =>
      taskNames
        .map((taskName) => ({
          id: taskName,
          label: taskName,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [taskNames]
  );

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={organOptions}
          selectedIds={organFilter.selected}
          onToggle={organFilter.toggle}
          onSelectAll={organFilter.selectAll}
          onClearAll={organFilter.clearAll}
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
              Patch-level classification
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[180px]">
              <span className="truncate">Task Categories (1/1)</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Spatial transcriptomics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <MultiSelectDropdown
          label="All Tasks"
          options={taskOptions}
          selectedIds={taskFilter.selected}
          onToggle={taskFilter.toggle}
          onSelectAll={taskFilter.selectAll}
          onClearAll={taskFilter.clearAll}
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
                  className="px-2 py-2 text-center font-semibold min-w-[80px] max-w-[120px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    Pearson
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
                    {modelAvgValues.get(model.id) !== undefined
                      ? formatNumber(modelAvgValues.get(model.id)!, 3)
                      : "-"}
                  </td>
                  {filteredTasks.map((task) => {
                    const value = modelResults?.get(task.id);
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
