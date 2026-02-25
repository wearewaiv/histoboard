"use client";

/**
 * Arena Page (/arena)
 *
 * Head-to-head comparison of 2–5 selected models. Features model search/selection,
 * task filtering by organ groups and category groups, win/tie/loss statistics,
 * and a detailed task-by-task comparison table. Organ and category groups normalize
 * inconsistent naming from different benchmarks into user-friendly labels.
 */

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { ArenaStats } from "@/components/arena/ArenaStats";
import { ArenaComparisonTable } from "@/components/arena/ArenaComparisonTable";
import { Search, X, AlertCircle } from "lucide-react";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";

import type { Model, Task, Result, Benchmark } from "@/types";
import {
  getUniqueGroupedOrgans,
  expandOrganGroup,
  getUniqueGroupedCategories,
  expandCategoryGroup,
} from "@/lib/organGroups";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];

const MAX_MODELS = 5;

// Get unique task types (based on benchmark category)
function getTaskTypes(): string[] {
  return ["calibration", "patch-level", "robustness", "segmentation", "slide-level"];
}

// Map task to its type based on benchmark
function getTaskType(task: Task, benchmarkMap: Map<string, Benchmark>): string {
  const benchmark = benchmarkMap.get(task.benchmarkId);
  if (!benchmark) return "unknown";

  const categories = Array.isArray(benchmark.category) ? benchmark.category : [benchmark.category];

  if (categories.includes("calibration")) return "calibration";
  if (categories.includes("robustness")) return "robustness";
  if (categories.includes("segmentation")) return "segmentation";
  if (categories.includes("patch-level")) return "patch-level";
  if (categories.includes("slide-level")) return "slide-level";

  return "slide-level"; // default
}

export default function ArenaPage() {
  // Create benchmark map for quick lookup
  const benchmarkMap = useMemo(() => {
    return new Map(benchmarks.map((b) => [b.id, b]));
  }, []);

  // Extract filter options
  const organs = useMemo(() => getUniqueGroupedOrgans(tasks), []);
  const categories = useMemo(() => getUniqueGroupedCategories(tasks), []);
  const taskTypes = useMemo(() => getTaskTypes(), []);

  // Model selection state
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  // Task filter states
  const [selectedOrgans, setSelectedOrgans] = useState<Set<string>>(() => new Set(organs));
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(() => new Set(taskTypes));
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set(categories));

  // Filter and sort models by search query (alphabetically by name)
  const filteredModels = useMemo(() => {
    let filtered = models;

    if (modelSearchQuery.trim()) {
      const query = modelSearchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      filtered = models.filter((m) => {
        const searchableText = [m.name, m.organization, m.architecture].join(" ").toLowerCase();
        return queryWords.every((word) => searchableText.includes(word));
      });
    }

    // Sort alphabetically by name
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [modelSearchQuery]);

  // Get selected models
  const selectedModels = useMemo(() => {
    return models.filter((m) => selectedModelIds.has(m.id));
  }, [selectedModelIds]);

  // Create results map: modelId -> taskId -> value
  const resultsMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const result of results) {
      if (!map.has(result.modelId)) {
        map.set(result.modelId, new Map());
      }
      map.get(result.modelId)!.set(result.taskId, result.value);
    }
    return map;
  }, []);

  // Expand selected organ groups to raw organ values for filtering
  const expandedSelectedOrgans = useMemo(() => {
    const expanded = new Set<string>();
    for (const organLabel of selectedOrgans) {
      for (const rawOrgan of expandOrganGroup(organLabel)) {
        expanded.add(rawOrgan);
      }
    }
    return expanded;
  }, [selectedOrgans]);

  // Expand selected category groups to raw category values for filtering
  const expandedSelectedCategories = useMemo(() => {
    const expanded = new Set<string>();
    for (const categoryLabel of selectedCategories) {
      for (const rawCategory of expandCategoryGroup(categoryLabel)) {
        expanded.add(rawCategory);
      }
    }
    return expanded;
  }, [selectedCategories]);

  // Filter tasks based on selected filters
  const filteredTasksByFilters = useMemo(() => {
    return tasks.filter((t) => {
      const taskType = getTaskType(t, benchmarkMap);
      return (
        expandedSelectedOrgans.has(t.organ.toLowerCase()) &&
        selectedTaskTypes.has(taskType) &&
        expandedSelectedCategories.has(t.category as string)
      );
    });
  }, [expandedSelectedOrgans, selectedTaskTypes, expandedSelectedCategories, benchmarkMap]);

  // Further filter to only tasks where ALL selected models have results
  const filteredTasks = useMemo(() => {
    if (selectedModels.length < 2) return filteredTasksByFilters;

    const selectedModelIdsList = selectedModels.map((m) => m.id);
    return filteredTasksByFilters.filter((task) => {
      // Check if ALL selected models have a result for this task
      return selectedModelIdsList.every((modelId) =>
        resultsMap.get(modelId)?.has(task.id)
      );
    });
  }, [filteredTasksByFilters, selectedModels, resultsMap]);

  // Toggle model selection (with max limit)
  const toggleModel = (modelId: string) => {
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else if (next.size < MAX_MODELS) {
        next.add(modelId);
      }
      return next;
    });
  };

  // Toggle filter helpers
  const toggleOrgan = (organ: string) => {
    setSelectedOrgans((prev) => {
      const next = new Set(prev);
      if (next.has(organ)) next.delete(organ);
      else next.add(organ);
      return next;
    });
  };

  const toggleTaskType = (taskType: string) => {
    setSelectedTaskTypes((prev) => {
      const next = new Set(prev);
      if (next.has(taskType)) next.delete(taskType);
      else next.add(taskType);
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

  // Reset all filters
  const resetFilters = () => {
    setSelectedOrgans(new Set(organs));
    setSelectedTaskTypes(new Set(taskTypes));
    setSelectedCategories(new Set(categories));
  };

  // Clear model selection
  const clearModels = () => {
    setSelectedModelIds(new Set());
  };

  // Compute rankings and stats for selected models
  const modelStats = useMemo(() => {
    if (selectedModels.length < 2) return new Map();

    const selectedModelIdsList = selectedModels.map((m) => m.id);
    const stats = new Map<string, {
      avgRank: number;
      avgValue: number;
      taskCount: number;
      wins: number;
      ties: number;
      losses: number;
    }>();

    // Compute per-task ranks among selected models only
    const taskRanks = new Map<string, Map<string, number>>();
    for (const task of filteredTasks) {
      const taskResults = selectedModelIdsList
        .map((modelId) => ({
          modelId,
          value: resultsMap.get(modelId)?.get(task.id),
        }))
        .filter((r) => r.value !== undefined)
        .sort((a, b) => b.value! - a.value!);

      const ranks = new Map<string, number>();
      taskResults.forEach((r, idx) => {
        ranks.set(r.modelId, idx + 1);
      });
      taskRanks.set(task.id, ranks);
    }

    // Compute per-model stats
    for (const modelId of selectedModelIdsList) {
      const ranks: number[] = [];
      const values: number[] = [];

      for (const task of filteredTasks) {
        const rank = taskRanks.get(task.id)?.get(modelId);
        const value = resultsMap.get(modelId)?.get(task.id);

        if (rank !== undefined) ranks.push(rank);
        if (value !== undefined) values.push(value);
      }

      // Compute win/tie/loss against other models
      let wins = 0, ties = 0, losses = 0;
      for (const otherId of selectedModelIdsList) {
        if (otherId === modelId) continue;

        for (const task of filteredTasks) {
          const myValue = resultsMap.get(modelId)?.get(task.id);
          const otherValue = resultsMap.get(otherId)?.get(task.id);

          if (myValue === undefined || otherValue === undefined) continue;

          if (myValue > otherValue) wins++;
          else if (myValue < otherValue) losses++;
          else ties++;
        }
      }

      if (ranks.length > 0) {
        stats.set(modelId, {
          avgRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
          avgValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
          taskCount: ranks.length,
          wins,
          ties,
          losses,
        });
      }
    }

    return stats;
  }, [selectedModels, filteredTasks, resultsMap]);

  // Task type label mapping
  const taskTypeLabels: Record<string, string> = {
    "calibration": "Calibration",
    "patch-level": "Patch-level classification",
    "robustness": "Robustness",
    "segmentation": "Segmentation",
    "slide-level": "Slide-level classification",
  };

  // Count benchmarks with filtered tasks
  const benchmarkCount = useMemo(() => {
    const benchmarkIds = new Set(filteredTasks.map((t) => t.benchmarkId));
    return benchmarkIds.size;
  }, [filteredTasks]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Arena</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Compare 2-5 models head-to-head across all benchmarks
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Model search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search models by name, organization..."
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {modelSearchQuery && (
                <button
                  onClick={() => setModelSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Model selection grid */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/30">
              {filteredModels.map((model) => {
                const isSelected = selectedModelIds.has(model.id);
                const isDisabled = !isSelected && selectedModelIds.size >= MAX_MODELS;

                return (
                  <Button
                    key={model.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isDisabled}
                    onClick={() => toggleModel(model.id)}
                    className="text-xs"
                  >
                    {model.name}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedModelIds.size}/{MAX_MODELS} models selected
                {selectedModelIds.size >= MAX_MODELS && (
                  <span className="ml-2 text-amber-600">(maximum reached)</span>
                )}
              </p>
              {selectedModelIds.size > 0 && (
                <Button variant="ghost" size="sm" onClick={clearModels}>
                  Clear selection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filter Tasks</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <MultiSelectDropdown
              label="Indications"
              options={organs.map((organ) => ({
                id: organ,
                label: organ.charAt(0).toUpperCase() + organ.slice(1),
              })).sort((a, b) => a.label.localeCompare(b.label))}
              selectedIds={selectedOrgans}
              onToggle={toggleOrgan}
              onSelectAll={() => setSelectedOrgans(new Set(organs))}
              onClearAll={() => setSelectedOrgans(new Set())}
            />
            <MultiSelectDropdown
              label="Task Types"
              options={taskTypes.map((type) => ({
                id: type,
                label: taskTypeLabels[type] || type,
              })).sort((a, b) => a.label.localeCompare(b.label))}
              selectedIds={selectedTaskTypes}
              onToggle={toggleTaskType}
              onSelectAll={() => setSelectedTaskTypes(new Set(taskTypes))}
              onClearAll={() => setSelectedTaskTypes(new Set())}
            />
            <MultiSelectDropdown
              label="Task Categories"
              options={categories.map((cat) => ({
                id: cat,
                label: cat,
              })).sort((a, b) => a.label.localeCompare(b.label))}
              selectedIds={selectedCategories}
              onToggle={toggleCategory}
              onSelectAll={() => setSelectedCategories(new Set(categories))}
              onClearAll={() => setSelectedCategories(new Set())}
            />
            <span className="text-sm text-muted-foreground">
              {filteredTasks.length} tasks across {benchmarkCount} benchmarks
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Task categories were grouped into semantically similar patterns. Please let us know if you find any inconsistency between task categories and reported tasks in the detailed comparison.
          </p>
        </CardContent>
      </Card>

      {/* Results Section */}
      {selectedModels.length < 2 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select at least 2 models</h3>
              <p className="text-muted-foreground max-w-md">
                Choose 2-5 models from the selection above to compare their performance across benchmarks.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <ArenaStats
            selectedModels={selectedModels}
            modelStats={modelStats}
          />

          {/* Detailed Comparison Table */}
          <ArenaComparisonTable
            selectedModels={selectedModels}
            filteredTasks={filteredTasks}
            allFilteredTasks={filteredTasksByFilters}
            resultsMap={resultsMap}
            benchmarks={benchmarks}
          />
        </>
      )}
    </div>
  );
}
