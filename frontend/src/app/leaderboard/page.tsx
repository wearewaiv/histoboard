"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { useFilters } from "@/hooks/useFilters";
import { useRankings } from "@/hooks/useRankings";
import { Badge } from "@/components/ui/badge";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";

import type { Model, Task, Result, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];

const availableOrgans = [...new Set(tasks.map((t) => t.organ))].sort();

export default function LeaderboardPage() {
  const {
    filters,
    toggleCategory,
    toggleOrgan,
    toggleBenchmark,
    resetFilters,
    hasActiveFilters,
  } = useFilters();

  const rankings = useRankings({ models, tasks, results, filters });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Compare pathology foundation models across {tasks.length} benchmark
          tasks
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar */}
        <aside>
          <FilterPanel
            filters={filters}
            benchmarks={benchmarks}
            availableOrgans={availableOrgans}
            onToggleCategory={toggleCategory}
            onToggleOrgan={toggleOrgan}
            onToggleBenchmark={toggleBenchmark}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* Main Table */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Model Rankings</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rankings.length} models ranked by mean performance
                  </p>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {filters.categories.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                    {filters.organs.map((o) => (
                      <Badge key={o} variant="secondary">
                        {o}
                      </Badge>
                    ))}
                    {filters.benchmarks.map((b) => (
                      <Badge key={b} variant="secondary">
                        {benchmarks.find((x) => x.id === b)?.shortName || b}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                rankings={rankings}
                models={models}
                showDetails={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
