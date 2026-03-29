"use client";

/**
 * Leaderboard Page (/leaderboard)
 *
 * Main ranking view. Displays a filterable table of models ranked across all
 * benchmarks, plus scatter charts showing scaling laws and model size vs.
 * performance. Uses useLeaderboardFilters for model attribute filtering and
 * useModelAttributeFilters for the shared filter bar.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { ScalingLawsChart } from "@/components/charts/ScalingLawsChart";
import { ModelSizePerformanceChart } from "@/components/charts/ModelSizePerformanceChart";
import { useLeaderboardFilters } from "@/hooks/useLeaderboardFilters";
import { computeBenchmarkRanks, BENCHMARK_REFS } from "@/lib/benchmarkConfig";

import modelsData from "@/data/models.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";

import type { Model, Benchmark, Task, Result } from "@/types";

const models = modelsData as Model[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; avgScore?: number; taskCount: number }>>;
const tasks = tasksData as Task[];
const results = resultsData as Result[];

// Pre-compute correct integer ranks per benchmark (respects avgScore when present)
const benchmarkRankData = computeBenchmarkRanks(rankings);

// Methodology metadata displayed in the summary table above the leaderboard
const BENCHMARK_METHODOLOGY: Record<string, { metric: string; source: "official" | "computed"; lowerIsBetter?: boolean }> = {
  eva:        { metric: "Mean AUROC across 13 tasks",          source: "computed" },
  pathbench:  { metric: "Avg. task rank across 229 tasks",     source: "computed",  lowerIsBetter: true },
  stanford:   { metric: "Mean AUROC across 41 tasks",          source: "computed" },
  hest:       { metric: "Mean Pearson r across 9 tissues",     source: "official" },
  pathobench: { metric: "Avg. task rank across 53 tasks",      source: "computed",  lowerIsBetter: true },
  sinai:      { metric: "Mean AUROC across 22 tasks",          source: "computed" },
  stamp:      { metric: "Avg. task rank across 31 tasks",      source: "computed",  lowerIsBetter: true },
  thunder:    { metric: "Rank sum across 6 tasks",             source: "official",  lowerIsBetter: true },
  pathorob:   { metric: "Robustness Index across 3 scenarios", source: "official" },
  plism:      { metric: "Aggregate robustness score",          source: "official" },
};

export default function LeaderboardPage() {
  const filters = useLeaderboardFilters(models, benchmarks, rankings);
  const { effectiveSelectedIds } = filters;

  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Build model rankings from pre-computed integer ranks (correctly ordered).
  // Empty deps: benchmarkRankData and BENCHMARK_REFS are module-level constants.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modelRankings = useMemo(() => {
    return models
      .map((model) => {
        const entry: { modelId: string; benchmarkCount: number; [k: string]: number | string | undefined } = {
          modelId: model.id,
          benchmarkCount: 0,
        };
        let count = 0;
        for (const ref of BENCHMARK_REFS) {
          const rank = benchmarkRankData[ref.id]?.ranks.get(model.id);
          if (rank !== undefined) {
            entry[ref.id] = rank;
            count++;
          }
        }
        entry.benchmarkCount = count;
        return entry;
      })
      .filter((e) => e.benchmarkCount > 0);
  }, []);

  // Filter rankings based on effective selected models
  const filteredModelRankings = useMemo(() => {
    return modelRankings.filter((ranking) => effectiveSelectedIds.has(ranking.modelId));
  }, [modelRankings, effectiveSelectedIds]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          An overview of pathology foundation models performance across multiple benchmarks
        </p>
      </div>

      {/* Ranking methodology summary */}
      <div className="mb-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted">
              <th className="px-3 py-2 text-left font-semibold">Benchmark</th>
              <th className="px-3 py-2 text-left font-semibold">Ranking metric</th>
              <th className="px-3 py-2 text-center font-semibold">Source</th>
              <th className="px-3 py-2 text-center font-semibold">Direction</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks
              .filter((b) => BENCHMARK_METHODOLOGY[b.id])
              .map((benchmark, i) => {
              const meta = BENCHMARK_METHODOLOGY[benchmark.id];
              return (
                <tr key={benchmark.id} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/30")}>
                  <td className="px-3 py-2 font-medium">
                    <a href={benchmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                      {benchmark.shortName}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{meta.metric}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                      meta.source === "official"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {meta.source === "official" ? "Official" : "Computed"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {meta.lowerIsBetter ? "↓ lower" : "↑ higher"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card>
        <CardContent className="pt-6">
              {/* Mobile filter toggle */}
              <div className="flex md:hidden items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                  Filters
                  {mobileFiltersOpen ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  ({effectiveSelectedIds.size}/{models.length} models)
                </span>
              </div>

              {/* Filter dropdowns - hidden on mobile unless toggled */}
              <div className={cn(
                mobileFiltersOpen ? "flex" : "hidden md:flex"
              )}>
                <div className="flex-1">
                  <LeaderboardFilters
                    filters={filters}
                    allModelCount={models.length}
                  />
                </div>
                <Link
                  href="/benchmarks"
                  className="text-sm text-primary hover:underline flex items-center gap-1 ml-auto self-start mt-1"
                >
                  View metrics →
                </Link>
              </div>

              <LeaderboardTable
                modelRankings={filteredModelRankings}
                models={models}
                benchmarks={benchmarks}
              />
        </CardContent>
      </Card>

      {/* Direct comparison */}
      <section className="mt-8">
      <div className="mb-8 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Direct comparison</h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Compare pathology foundation models on a common set of benchmarks
        </p>
      </div>

        <Card>
          <CardContent className="pt-6">
            <ScalingLawsChart
              models={models}
              tasks={tasks}
              results={results}
            />
          </CardContent>
        </Card>
      </section>

      {/* Model Size vs Performance */}
      <section className="mt-8">
        <div className="mb-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Scaling laws</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Explore how model size correlates with performance or robustness across benchmarks
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ModelSizePerformanceChart
              models={models}
              tasks={tasks}
              results={results}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
