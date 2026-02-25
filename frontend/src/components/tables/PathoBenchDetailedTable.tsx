"use client";

/**
 * Patho-Bench Detailed Table
 *
 * Renders per-task results for the Patho-Bench benchmark (Mahmood Lab).
 * Standard filter setup with organs, categories, task names, and text search.
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "pathobench")
 */

import React from "react";
import Link from "next/link";
import { Search, X, ChevronDown } from "lucide-react";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, formatMetricLabel, getValueColor } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildOrganOptions, buildTaskNameOptions } from "@/lib/tableUtils";
import { useTaskFiltering } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

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
}: PathoBenchDetailedTableProps) {
  // Shared filter hook with search
  const {
    filteredTasks,
    organs,
    categories,
    taskNames,
    search,
    availableOrgans,
    availableCategories,
    availableTaskNames,
  } = useTaskFiltering(tasks, {
    enableSearch: true,
    searchOverridesFilters: true,
    searchFields: ["name", "category", "organ", "metric"],
  });

  // Shared data computation hook
  const { resultsMap, taskStats, modelAvgRanks, modelAvgValues, sortedModels } =
    useDetailedTableData({ models, filteredTasks, results });

  // Build dropdown options
  const organOptions = buildOrganOptions(availableOrgans);
  const categoryOptions = buildTaskNameOptions(availableCategories);
  const taskOptions = buildTaskNameOptions(availableTaskNames);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[140px]">
              <span className="truncate">Task Type (1/1)</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Slide-level Classification
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <MultiSelectDropdown
          label="Task Categories"
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
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            className="pl-8 pr-8 h-9"
          />
          {search.query && (
            <button
              onClick={search.clearQuery}
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
                    {formatMetricLabel(task.metric)}
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
