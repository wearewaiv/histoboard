"use client";

/**
 * Stanford PathBench Detailed Table
 *
 * Renders per-task results for the Stanford PathBench benchmark. Supports
 * switching between 4 metrics (AUROC, Balanced Accuracy, Sensitivity, Specificity)
 * and displays confidence intervals. Maintains a separate resultsMap alongside
 * the shared hook to store all metric fields needed for CI rendering.
 *
 * Used by: app/benchmarks/[id]/page.tsx (benchmark ID "stanford")
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, X, ChevronDown } from "lucide-react";
import type { Model, Task } from "@/types";
import type { StanfordResult } from "@/types/results";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildDropdownOptions, buildTaskNameOptions } from "@/lib/tableUtils";
import { useSetToggle } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

// Format cryptic task names to be more readable
function formatTaskName(name: string): string {
  const nameMap: Record<string, string> = {
    "lung exp subtype": "Lung Expression Subtype",
    "lusc vs luad": "LUSC vs LUAD",
    "CPTAC-MYC": "MYC Activation (CPTAC)",
    Chrom: "Chromatin Remodeling",
    "CPTAC-grade": "Tumor Grade (CPTAC)",
    "tumor label": "Tumor Label",
    MTOR: "mTOR Pathway",
    P53: "P53 Pathway",
    SWI: "SWI/SNF Pathway",
    "gi subtype": "GI Subtype",
    "ERG status": "ERG Status",
    "prad mrna cluster": "Prostate mRNA Cluster",
    "lung hist OOD1": "Lung Histology (OOD 1)",
    "lung hist OOD2": "Lung Histology (OOD 2)",
    "lung stage OOD": "Lung Stage (OOD)",
    "lung stage": "Lung Stage",
    "lung grade": "Lung Grade",
    "brain necrosis": "Brain Necrosis",
    "brain exp subtype": "Brain Expression Subtype",
    "brain hist subtype": "Brain Histology Subtype",
    "MGMT OOD": "MGMT Status (OOD)",
    MGMT: "MGMT Status",
    IDH: "IDH Status",
    Immunegroup: "Immune Group",
    MYC: "MYC Status",
    PI3K: "PI3K Pathway",
    "TCGA-Grade": "Tumor Grade (TCGA)",
    "PAM50 status": "PAM50 Status",
    "ER status": "ER Status",
    "PR status": "PR Status",
    "blca hist subtype": "Bladder Histology Subtype",
    "blca mrna cluster": "Bladder mRNA Cluster",
    "kidney subtype": "Kidney Subtype",
  };
  return nameMap[name] || name;
}

// Format organ names for display
function formatOrgan(organ: string): string {
  const organMap: Record<string, string> = {
    lung: "Lung",
    breast: "Breast",
    brain: "Brain",
    prostate: "Prostate",
    colon: "Colon",
    bladder: "Bladder",
    kidney: "Kidney",
    GI: "Gastrointestinal",
    "pan-cancer": "Pan-cancer",
  };
  return organMap[organ] || organ.charAt(0).toUpperCase() + organ.slice(1);
}

// Determine if a task is Slide-level or Patch-level classification
function getClassificationLevel(taskName: string): string {
  const patchLevelTasks = new Set([
    "BACH",
    "BRACS",
    "BreakHis",
    "LC25000",
    "MHIST",
    "NCT-CRC-HE",
    "SICAPv2",
    "UniToPatho",
  ]);
  return patchLevelTasks.has(taskName) ? "Patch" : "Slide";
}

interface StanfordDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: StanfordResult[];
  modelRankings: { modelId: string; overallRank: number }[];
}

/** The four metrics selectable in the Stanford table header. */
type StanfordMetric =
  | "auroc"
  | "balanced_accuracy"
  | "sensitivity"
  | "specificity";

const METRIC_OPTIONS: { value: StanfordMetric; label: string }[] = [
  { value: "auroc", label: "AUROC" },
  { value: "balanced_accuracy", label: "Balanced Accuracy" },
  { value: "sensitivity", label: "Sensitivity" },
  { value: "specificity", label: "Specificity" },
];

/** Returns the display label for a given Stanford metric selection. */
function getMetricLabel(metric: StanfordMetric): string {
  return METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? metric;
}

const CLASSIFICATION_LEVELS = ["Slide", "Patch"];

export function StanfordDetailedTable({
  models,
  tasks,
  results,
}: StanfordDetailedTableProps) {
  // Available filter values
  const availableOrgans = useMemo(
    () => [...new Set(tasks.map((t) => t.organ))].sort(),
    [tasks]
  );
  const availableCategories = useMemo(
    () => [...new Set(tasks.map((t) => t.category as string))].sort(),
    [tasks]
  );
  const availableTaskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  // Filter state via shared hook
  const organs = useSetToggle(availableOrgans);
  const categories = useSetToggle(availableCategories);
  const taskNamesFilter = useSetToggle(availableTaskNames);
  const levels = useSetToggle<string>(CLASSIFICATION_LEVELS);
  const [selectedMetric, setSelectedMetric] = useState<StanfordMetric>("auroc");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract the selected metric value from a result
  const getMetricValue = useCallback(
    (result: StanfordResult): number | undefined => {
      switch (selectedMetric) {
        case "auroc":
          return result.value;
        case "balanced_accuracy":
          return result.balancedAccuracy;
        case "sensitivity":
          return result.sensitivity;
        case "specificity":
          return result.specificity;
        default:
          return result.value;
      }
    },
    [selectedMetric]
  );

  // Filter tasks (search overrides filters when active)
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    if (query) {
      const queryWords = query.split(/\s+/);
      filtered = tasks.filter((t) => {
        const searchableText = [
          t.name,
          formatTaskName(t.name),
          t.category as string,
          t.organ,
        ]
          .join(" ")
          .toLowerCase();
        return queryWords.every((word) => searchableText.includes(word));
      });
    } else {
      filtered = tasks.filter(
        (t) =>
          organs.selected.has(t.organ) &&
          categories.selected.has(t.category as string) &&
          taskNamesFilter.selected.has(t.name) &&
          levels.selected.has(getClassificationLevel(t.name))
      );
    }

    return filtered.sort((a, b) =>
      formatTaskName(a.name).localeCompare(formatTaskName(b.name))
    );
  }, [
    tasks,
    organs.selected,
    categories.selected,
    taskNamesFilter.selected,
    levels.selected,
    searchQuery,
  ]);

  // Shared data computation hook (with custom metric extraction)
  const { taskStats, modelAvgRanks, modelAvgValues, sortedModels } =
    useDetailedTableData<StanfordResult>({
      models,
      filteredTasks,
      results,
      getMetricValue,
    });

  // Separate resultsMap from the hook's: useDetailedTableData only stores a single
  // numeric value per (model, task), but Stanford cells need all metric fields
  // (auroc, balancedAccuracy, etc.) plus their CI bounds for rendering.
  const resultsMap = useMemo(() => {
    const map = new Map<
      string,
      Map<
        string,
        {
          auroc: number;
          balancedAccuracy?: number;
          sensitivity?: number;
          specificity?: number;
          aurocLower?: number;
          aurocUpper?: number;
          balancedAccuracyLower?: number;
          balancedAccuracyUpper?: number;
          sensitivityLower?: number;
          sensitivityUpper?: number;
          specificityLower?: number;
          specificityUpper?: number;
        }
      >
    >();
    for (const result of results) {
      if (!map.has(result.modelId)) {
        map.set(result.modelId, new Map());
      }
      map.get(result.modelId)!.set(result.taskId, {
        auroc: result.value,
        balancedAccuracy: result.balancedAccuracy,
        sensitivity: result.sensitivity,
        specificity: result.specificity,
        aurocLower: result.aurocLower,
        aurocUpper: result.aurocUpper,
        balancedAccuracyLower: result.balancedAccuracyLower,
        balancedAccuracyUpper: result.balancedAccuracyUpper,
        sensitivityLower: result.sensitivityLower,
        sensitivityUpper: result.sensitivityUpper,
        specificityLower: result.specificityLower,
        specificityUpper: result.specificityUpper,
      });
    }
    return map;
  }, [results]);

  // Filter to models with visible results, then sort by mean selected metric desc.
  // Tiebreakers: avg task rank asc → name alphabetical. Consistent with global leaderboard.
  const displayedModels = useMemo(() => {
    return sortedModels
      .filter((model) => filteredTasks.some((task) => resultsMap.get(model.id)?.has(task.id)))
      .sort((a, b) => {
        const avgA = modelAvgValues.get(a.id) ?? Number.NEGATIVE_INFINITY;
        const avgB = modelAvgValues.get(b.id) ?? Number.NEGATIVE_INFINITY;
        if (avgA !== avgB) return avgB - avgA;
        const rankA = modelAvgRanks.get(a.id) ?? Number.POSITIVE_INFINITY;
        const rankB = modelAvgRanks.get(b.id) ?? Number.POSITIVE_INFINITY;
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [sortedModels, filteredTasks, resultsMap, modelAvgValues, modelAvgRanks]);

  return (
    <div>
      {/* Metric dropdown and Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[140px]"
            >
              <span className="truncate">
                {METRIC_OPTIONS.find((m) => m.value === selectedMetric)
                  ?.label || selectedMetric}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={selectedMetric}
              onValueChange={(value) => setSelectedMetric(value as StanfordMetric)}
            >
              {METRIC_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <MultiSelectDropdown
          label="Indications"
          options={buildDropdownOptions(availableOrgans, formatOrgan)}
          selectedIds={organs.selected}
          onToggle={organs.toggle}
          onSelectAll={organs.selectAll}
          onClearAll={organs.clearAll}
        />
        <MultiSelectDropdown
          label="Task Type"
          options={CLASSIFICATION_LEVELS.map((level) => ({
            id: level,
            label:
              level === "Slide"
                ? "Slide-level classification"
                : "Patch-level classification",
          })).sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={levels.selected}
          onToggle={levels.toggle}
          onSelectAll={levels.selectAll}
          onClearAll={levels.clearAll}
        />
        <MultiSelectDropdown
          label="Task Categories"
          options={buildTaskNameOptions(availableCategories)}
          selectedIds={categories.selected}
          onToggle={categories.toggle}
          onSelectAll={categories.selectAll}
          onClearAll={categories.clearAll}
        />
        <MultiSelectDropdown
          label="All Tasks"
          options={buildDropdownOptions(availableTaskNames, formatTaskName)}
          selectedIds={taskNamesFilter.selected}
          onToggle={taskNamesFilter.toggle}
          onSelectAll={taskNamesFilter.selectAll}
          onClearAll={taskNamesFilter.clearAll}
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
                    {formatTaskName(task.name)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal whitespace-nowrap mt-0.5">
                    {getMetricLabel(selectedMetric)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const avgRank = modelAvgRanks.get(model.id);

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
                    let value: number | undefined;
                    let lower: number | undefined;
                    let upper: number | undefined;

                    if (result) {
                      switch (selectedMetric) {
                        case "auroc":
                          value = result.auroc;
                          lower = result.aurocLower;
                          upper = result.aurocUpper;
                          break;
                        case "balanced_accuracy":
                          value = result.balancedAccuracy;
                          lower = result.balancedAccuracyLower;
                          upper = result.balancedAccuracyUpper;
                          break;
                        case "sensitivity":
                          value = result.sensitivity;
                          lower = result.sensitivityLower;
                          upper = result.sensitivityUpper;
                          break;
                        case "specificity":
                          value = result.specificity;
                          lower = result.specificityLower;
                          upper = result.specificityUpper;
                          break;
                      }
                    }

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
                          <div>
                            <span className="font-medium">
                              {formatNumber(value, 3)}
                            </span>
                            {lower !== undefined && upper !== undefined && (
                              <div className="text-[10px] text-muted-foreground">
                                [{formatNumber(lower, 2)}-
                                {formatNumber(upper, 2)}]
                              </div>
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
