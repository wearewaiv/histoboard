"use client";

/**
 * STAMP Detailed Table Component
 *
 * Displays a detailed performance table for the STAMP benchmark.
 * This component demonstrates how to use the shared `useDetailedTableData` hook
 * to build benchmark-specific tables without duplicating computation logic.
 *
 * ## What This Component Does
 *
 * 1. Shows filter dropdowns (Indications, Task Categories, etc.)
 * 2. Renders a table with:
 *    - Rows: One per model, sorted by average rank
 *    - Columns: One per task, plus "Average Rank" and "Average Metric"
 *    - Cells: Colored based on relative performance (green=good, red=bad)
 *
 * ## How Filtering Works
 *
 * Users can filter tasks by:
 * - **Indication (organ)**: e.g., breast, colon, lung
 * - **Category**: Biomarker, Morphology, Prognosis
 * - **Task name**: Specific task selection
 * - **Search**: Text search across all task attributes
 *
 * When the user types in the search box, all filter dropdowns are bypassed
 * and we search across all tasks. When the search box is empty, the dropdown
 * filters are applied.
 *
 * ## Key Data Flow
 *
 * ```
 * Props (models, tasks, results)
 *     ↓
 * [Filter tasks by user selections] → filteredTasks
 *     ↓
 * [useDetailedTableData hook] → resultsMap, taskStats, modelAvgRanks, sortedModels
 *     ↓
 * [Render table] → Display sorted models with colored cells
 * ```
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ChevronDown } from "lucide-react";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

interface STAMPDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function STAMPDetailedTable({
  models,
  tasks,
  results,
}: STAMPDetailedTableProps) {
  // Get unique filter options
  const organs = useMemo(() => {
    return [...new Set(tasks.map((t) => t.organ))].sort();
  }, [tasks]);

  const categories = useMemo(() => {
    return [...new Set(tasks.map((t) => t.category as string))].sort();
  }, [tasks]);

  const taskNames = useMemo(() => {
    return [...new Set(tasks.map((t) => t.name))].sort();
  }, [tasks]);

  // Filter states - all selected by default
  const [selectedOrgans, setSelectedOrgans] = useState<Set<string>>(
    () => new Set(organs)
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(categories)
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
    () => new Set(taskNames)
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle helpers
  const toggleOrgan = (organ: string) => {
    setSelectedOrgans((prev) => {
      const next = new Set(prev);
      if (next.has(organ)) next.delete(organ);
      else next.add(organ);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleTask = (taskName: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskName)) next.delete(taskName);
      else next.add(taskName);
      return next;
    });
  };

  // Filter tasks by selected filters and search query
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    if (query) {
      // Search across all tasks when query is present
      const queryWords = query.split(/\s+/);
      filtered = tasks.filter((t) => {
        const searchableText = [t.name, t.category as string, t.organ]
          .join(" ")
          .toLowerCase();
        return queryWords.every((word) => searchableText.includes(word));
      });
    } else {
      // Apply filters
      filtered = tasks.filter(
        (t) =>
          selectedOrgans.has(t.organ) &&
          selectedCategories.has(t.category as string) &&
          selectedTasks.has(t.name)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, selectedOrgans, selectedCategories, selectedTasks, searchQuery]);

  // Use shared hook for common computations
  const {
    resultsMap,
    taskStats,
    modelAvgRanks,
    modelAvgValues,
    sortedModels,
  } = useDetailedTableData({ models, filteredTasks, results });

  // Build dropdown options
  const organOptions = organs
    .map((organ) => ({
      id: organ,
      label: organ.charAt(0).toUpperCase() + organ.slice(1),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryOptions = categories
    .map((cat) => ({
      id: cat,
      label:
        cat === "Biomarker"
          ? "Biomarker prediction"
          : cat === "Morphology"
          ? "Morphology prediction"
          : cat,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const taskOptions = taskNames
    .map((name) => ({ id: name, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      {/* Benchmark description */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          <strong>STAMP Benchmark</strong> (Nature Biomedical Engineering, 2025) evaluates 15 foundation models as feature
          extractors for weakly supervised computational pathology across morphology, biomarker, and prognosis tasks.
          Data sourced from the original publication (
          <a
            href="https://static-content.springer.com/esm/art%3A10.1038%2Fs41551-025-01516-3/MediaObjects/41551_2025_1516_MOESM5_ESM.xlsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Figure 2 Source Data
          </a>).
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={organOptions}
          selectedIds={selectedOrgans}
          onToggle={toggleOrgan}
          onSelectAll={() => setSelectedOrgans(new Set(organs))}
          onClearAll={() => setSelectedOrgans(new Set())}
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
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onSelectAll={() => setSelectedCategories(new Set(categories))}
          onClearAll={() => setSelectedCategories(new Set())}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={taskOptions}
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
        AUROC values from weakly supervised slide-level classification.
      </p>

      <div className="overflow-x-auto border rounded-lg">
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
                  className="px-2 py-2 text-center font-semibold min-w-[90px] max-w-[150px] bg-muted"
                >
                  <div className="text-xs whitespace-normal leading-tight">
                    {task.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    AUROC
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
                    const result = modelResults?.get(task.id);
                    const value = result?.value;
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
