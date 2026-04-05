"use client";

/**
 * PathoROB Detailed Table
 *
 * Renders per-task results for the PathoROB robustness benchmark (BIFOLD).
 * Evaluates model robustness under domain shift scenarios.
 * Sorted by average robustness index (descending) — higher is better.
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "pathorob")
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
import { buildOrganOptions, buildTaskNameOptions } from "@/lib/tableUtils";
import { useSimpleTaskFiltering } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

// Footnotes for results sourced from external publications rather than
// the PathoROB authors' own benchmarking study.
const FOOTNOTES: { text: string; url: string }[] = [
  {
    text: "Results taken from Atlas 2 preprint",
    url: "https://arxiv.org/pdf/2601.05148",
  },
  {
    text: "Results taken from GenBio-PathFM preprint",
    url: "https://www.biorxiv.org/content/10.64898/2026.03.17.712534v1.full.pdf",
  },
];

// Map model ID → 1-based footnote index (into FOOTNOTES array above)
const MODEL_FOOTNOTE: Record<string, number> = {
  aignostics_atlas_2: 1,
  bioptimus_h_optimus_1: 2,
  genbio_ai_genbio_pathfm: 2,
};

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
}: PathoROBDetailedTableProps) {
  // Shared filter hook for organs + task names
  const { filteredTasks, organs, taskNames, availableOrgans, availableTaskNames } =
    useSimpleTaskFiltering(tasks);

  // Shared data computation hook
  const { resultsMap, taskStats, modelAvgRanks, modelAvgValues } =
    useDetailedTableData({ models, filteredTasks, results });

  // Custom sort: by average robustness (higher is better), not avgRank
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const robA = modelAvgValues.get(a.id) ?? 0;
      const robB = modelAvgValues.get(b.id) ?? 0;
      return robB - robA;
    });
  }, [models, modelAvgValues]);

  // Dropdown options
  const organOptions = buildOrganOptions(availableOrgans);
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

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredTasks.length} domain shift scenarios.
        Robustness Index values - higher values indicate better robustness to distribution shifts.
      </p>

      <div className="overflow-x-auto overflow-y-auto max-h-[65vh] border rounded-lg">
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
                    Rob. Index
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);

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
                      {MODEL_FOOTNOTE[model.id] !== undefined && (
                        <sup className="text-[10px] text-muted-foreground ml-0.5">
                          [{MODEL_FOOTNOTE[model.id]}]
                        </sup>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {modelAvgRanks.get(model.id) !== undefined
                      ? formatNumber(modelAvgRanks.get(model.id)!, 2)
                      : "-"}
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
      <div className="mt-3 space-y-1">
        {FOOTNOTES.map((fn, i) => (
          <p key={i} className="text-xs text-muted-foreground">
            <span className="font-medium">[{i + 1}]</span>{" "}
            <a
              href={fn.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {fn.text}
            </a>
          </p>
        ))}
      </div>
    </div>
  );
}
