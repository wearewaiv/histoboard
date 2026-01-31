"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Model, Task } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

// Format cryptic task names to be more readable
function formatTaskName(name: string): string {
  const nameMap: Record<string, string> = {
    "lung exp subtype": "Lung Expression Subtype",
    "lusc vs luad": "LUSC vs LUAD",
    "CPTAC-MYC": "MYC Activation (CPTAC)",
    "Chrom": "Chromatin Remodeling",
    "CPTAC-grade": "Tumor Grade (CPTAC)",
    "tumor label": "Tumor Label",
    "MTOR": "mTOR Pathway",
    "P53": "P53 Pathway",
    "SWI": "SWI/SNF Pathway",
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
    "MGMT": "MGMT Status",
    "IDH": "IDH Status",
    "Immunegroup": "Immune Group",
    "MYC": "MYC Status",
    "PI3K": "PI3K Pathway",
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
    "lung": "Lung",
    "breast": "Breast",
    "brain": "Brain",
    "prostate": "Prostate",
    "colon": "Colon",
    "bladder": "Bladder",
    "kidney": "Kidney",
    "GI": "Gastrointestinal",
    "pan-cancer": "Pan-cancer",
  };
  return organMap[organ] || organ.charAt(0).toUpperCase() + organ.slice(1);
}

// Determine if a task is Slide-level or Patch-level classification
// External benchmarking datasets are typically Patch-level
function getClassificationLevel(taskName: string): "Slide" | "Patch" {
  const patchLevelTasks = new Set([
    "BACH", "BRACS", "BreakHis", "LC25000", "MHIST",
    "NCT-CRC-HE", "SICAPv2", "UniToPatho"
  ]);
  return patchLevelTasks.has(taskName) ? "Patch" : "Slide";
}

interface StanfordResult {
  modelId: string;
  taskId: string;
  value: number;
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
  source: string;
}

interface StanfordDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: StanfordResult[];
  modelRankings: { modelId: string; overallRank: number }[];
}

type MetricType = "auroc" | "balanced_accuracy" | "sensitivity" | "specificity";
type ClassificationLevel = "Slide" | "Patch";

const METRIC_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "auroc", label: "AUROC" },
  { value: "balanced_accuracy", label: "Balanced Accuracy" },
  { value: "sensitivity", label: "Sensitivity" },
  { value: "specificity", label: "Specificity" },
];

export function StanfordDetailedTable({
  models,
  tasks,
  results,
  modelRankings,
}: StanfordDetailedTableProps) {
  // Get unique organs for filtering
  const organs = useMemo(() => {
    return [...new Set(tasks.map((t) => t.organ))].sort();
  }, [tasks]);

  // Get unique task categories for filtering
  const categories = useMemo(() => {
    return [...new Set(tasks.map((t) => t.category as string))].sort();
  }, [tasks]);

  // Get unique task names for filtering
  const taskNames = useMemo(() => {
    return [...new Set(tasks.map((t) => t.name))].sort();
  }, [tasks]);

  // Get unique classification levels
  const classificationLevels: ClassificationLevel[] = ["Slide", "Patch"];

  // Filter states
  const [selectedOrgans, setSelectedOrgans] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
    new Set<string>()
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<ClassificationLevel>>(
    new Set<ClassificationLevel>(classificationLevels)
  );
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("auroc");
  const [searchQuery, setSearchQuery] = useState("");
  const initializedRef = useRef(false);

  // Initialize selected values when options become available (only once)
  useEffect(() => {
    if (!initializedRef.current && organs.length > 0 && categories.length > 0 && taskNames.length > 0) {
      setSelectedOrgans(new Set(organs));
      setSelectedCategories(new Set(categories));
      setSelectedTasks(new Set(taskNames));
      initializedRef.current = true;
    }
  }, [organs, categories, taskNames]);

  // Toggle helpers
  const toggleOrgan = (organ: string) => {
    setSelectedOrgans((prev) => {
      const next = new Set(prev);
      if (next.has(organ)) {
        next.delete(organ);
      } else {
        next.add(organ);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
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

  const toggleLevel = (level: ClassificationLevel) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Filter tasks by selected organs, categories, task names, classification levels, and search query
  // When there's a search query, it searches across ALL tasks (ignoring filters)
  // Sort alphabetically by formatted task name
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered: Task[];
    // If there's a search query, search across all tasks
    if (query) {
      filtered = tasks.filter((t) =>
        t.name.toLowerCase().includes(query) ||
        formatTaskName(t.name).toLowerCase().includes(query) ||
        (t.category as string).toLowerCase().includes(query) ||
        t.organ.toLowerCase().includes(query)
      );
    } else {
      // Otherwise, apply all filters
      filtered = tasks.filter(
        (t) =>
          selectedOrgans.has(t.organ) &&
          selectedCategories.has(t.category as string) &&
          selectedTasks.has(t.name) &&
          selectedLevels.has(getClassificationLevel(t.name))
      );
    }

    // Sort alphabetically by formatted task name
    return filtered.sort((a, b) =>
      formatTaskName(a.name).localeCompare(formatTaskName(b.name))
    );
  }, [tasks, selectedOrgans, selectedCategories, selectedTasks, selectedLevels, searchQuery]);

  // Create a lookup map for results: modelId -> taskId -> all metrics
  const resultsMap = useMemo(() => {
    const map = new Map<string, Map<string, {
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
    }>>();
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

  // Get the metric value for a result based on selected metric
  const getMetricValue = (result: StanfordResult): number | undefined => {
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
  };

  // Get min/max for each task for color scaling (based on selected metric)
  const taskStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();
    for (const task of filteredTasks) {
      const values: number[] = [];
      for (const result of results) {
        if (result.taskId === task.id) {
          const value = getMetricValue(result);
          if (value !== undefined) {
            values.push(value);
          }
        }
      }
      if (values.length > 0) {
        stats.set(task.id, {
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }
    return stats;
  }, [filteredTasks, results, selectedMetric]);

  // Compute average rank per model (across filtered tasks, using selected metric)
  const modelAvgRanks = useMemo(() => {
    const avgRanks = new Map<string, number>();

    // For each task, compute ranks
    const taskRanks = new Map<string, Map<string, number>>();
    for (const task of filteredTasks) {
      const taskResults = results
        .filter((r) => r.taskId === task.id)
        .map((r) => ({
          modelId: r.modelId,
          value: getMetricValue(r) ?? 0,
        }))
        .sort((a, b) => b.value - a.value); // Higher is better

      const ranks = new Map<string, number>();
      taskResults.forEach((r, idx) => {
        ranks.set(r.modelId, idx + 1);
      });
      taskRanks.set(task.id, ranks);
    }

    // Compute average rank per model
    for (const model of models) {
      const ranks: number[] = [];
      for (const task of filteredTasks) {
        const rank = taskRanks.get(task.id)?.get(model.id);
        if (rank !== undefined) {
          ranks.push(rank);
        }
      }
      if (ranks.length > 0) {
        avgRanks.set(model.id, ranks.reduce((a, b) => a + b, 0) / ranks.length);
      }
    }

    return avgRanks;
  }, [models, filteredTasks, results, selectedMetric]);

  // Compute average metric value per model (across filtered tasks, using selected metric)
  const modelAvgValues = useMemo(() => {
    const avgValues = new Map<string, number>();

    for (const model of models) {
      const values: number[] = [];
      for (const task of filteredTasks) {
        const result = results.find(r => r.modelId === model.id && r.taskId === task.id);
        if (result) {
          const value = getMetricValue(result);
          if (value !== undefined) {
            values.push(value);
          }
        }
      }
      if (values.length > 0) {
        avgValues.set(model.id, values.reduce((a, b) => a + b, 0) / values.length);
      }
    }

    return avgValues;
  }, [models, filteredTasks, results, selectedMetric]);

  // Sort models by average rank
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const rankA = modelAvgRanks.get(a.id) ?? 999;
      const rankB = modelAvgRanks.get(b.id) ?? 999;
      return rankA - rankB;
    });
  }, [models, modelAvgRanks]);

  // Get value color based on relative performance
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

  // Get metric display info
  const getMetricLabel = (metric: MetricType): string => {
    return METRIC_OPTIONS.find(m => m.value === metric)?.label || metric;
  };

  return (
    <div>
      {/* Benchmark description */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          <strong>Stanford PathBench</strong> is a comprehensive benchmark evaluating 31 foundation models across
          41 tasks from TCGA, CPTAC, and external datasets. Data sourced from the{" "}
          <a
            href="https://pathbench.stanford.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            official Stanford PathBench website
          </a>.
        </p>
      </div>

      {/* Metric dropdown and Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
          className="h-9 px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {METRIC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <MultiSelectDropdown
          label="Indications"
          options={organs
            .map((organ) => ({
              id: organ,
              label: formatOrgan(organ),
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedOrgans}
          onToggle={toggleOrgan}
          onSelectAll={() => setSelectedOrgans(new Set(organs))}
          onClearAll={() => setSelectedOrgans(new Set())}
        />
        <MultiSelectDropdown
          label="Task Categories"
          options={categories
            .map((category) => ({
              id: category,
              label: category,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onSelectAll={() => setSelectedCategories(new Set(categories))}
          onClearAll={() => setSelectedCategories(new Set())}
        />
        <MultiSelectDropdown
          label="Tasks"
          options={taskNames
            .map((taskName) => ({
              id: taskName,
              label: formatTaskName(taskName),
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedTasks}
          onToggle={toggleTask}
          onSelectAll={() => setSelectedTasks(new Set(taskNames))}
          onClearAll={() => setSelectedTasks(new Set())}
        />
        <MultiSelectDropdown
          label="Level"
          options={classificationLevels
            .map((level) => ({
              id: level,
              label: level === "Slide" ? "Slide-level" : "Patch-level",
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={selectedLevels}
          onToggle={toggleLevel}
          onSelectAll={() => setSelectedLevels(new Set(classificationLevels))}
          onClearAll={() => setSelectedLevels(new Set())}
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
        Metric: {getMetricLabel(selectedMetric)}{selectedMetric === "auroc" ? " (default metric reported by authors)" : ""}.
        Task names have been reformatted for clarity.
      </p>

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
                    {modelAvgValues.get(model.id) !== undefined ? formatNumber(modelAvgValues.get(model.id)!, 3) : "-"}
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
                          value !== undefined && getValueColor(value, task.id)
                        )}
                      >
                        {value !== undefined ? (
                          <div>
                            <span className="font-medium">
                              {formatNumber(value, 3)}
                            </span>
                            {lower !== undefined && upper !== undefined && (
                              <div className="text-[10px] text-muted-foreground">
                                [{formatNumber(lower, 2)}-{formatNumber(upper, 2)}]
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
