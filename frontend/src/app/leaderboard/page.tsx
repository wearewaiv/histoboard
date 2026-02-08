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

import modelsData from "@/data/models.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";

import type { Model, Benchmark, Task, Result } from "@/types";

const models = modelsData as Model[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;
const tasks = tasksData as Task[];
const results = resultsData as Result[];

export default function LeaderboardPage() {
  const filters = useLeaderboardFilters(models, benchmarks, rankings);
  const { effectiveSelectedIds } = filters;

  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Collect per-benchmark average ranks for each model
  const modelRankings = useMemo(() => {
    const rankingsList: { modelId: string; eva?: number; pathbench?: number; stanford?: number; hest?: number; pathobench?: number; sinai?: number; stamp?: number; thunder?: number; pathorob?: number; plism?: number; benchmarkCount: number }[] = [];

    for (const model of models) {
      const evaRank = rankings.eva?.[model.id]?.avgRank;
      const pathbenchRank = rankings.pathbench?.[model.id]?.avgRank;
      const stanfordRank = rankings.stanford?.[model.id]?.avgRank;
      const hestRank = rankings.hest?.[model.id]?.avgRank;
      const pathobenchRank = rankings.pathobench?.[model.id]?.avgRank;
      const sinaiRank = rankings.sinai?.[model.id]?.avgRank;
      const stampRank = rankings.stamp?.[model.id]?.avgRank;
      const thunderRank = rankings.thunder?.[model.id]?.avgRank;
      const pathorobRank = rankings.pathorob?.[model.id]?.avgRank;
      const plismRank = rankings.plism?.[model.id]?.avgRank;

      const benchmarkCount =
        (evaRank !== undefined ? 1 : 0) +
        (pathbenchRank !== undefined ? 1 : 0) +
        (stanfordRank !== undefined ? 1 : 0) +
        (hestRank !== undefined ? 1 : 0) +
        (pathobenchRank !== undefined ? 1 : 0) +
        (sinaiRank !== undefined ? 1 : 0) +
        (stampRank !== undefined ? 1 : 0) +
        (thunderRank !== undefined ? 1 : 0) +
        (pathorobRank !== undefined ? 1 : 0) +
        (plismRank !== undefined ? 1 : 0);

      if (benchmarkCount > 0) {
        rankingsList.push({
          modelId: model.id,
          eva: evaRank,
          pathbench: pathbenchRank,
          stanford: stanfordRank,
          hest: hestRank,
          pathobench: pathobenchRank,
          sinai: sinaiRank,
          stamp: stampRank,
          thunder: thunderRank,
          pathorob: pathorobRank,
          plism: plismRank,
          benchmarkCount,
        });
      }
    }

    return rankingsList;
  }, []);

  // Filter rankings based on effective selected models
  const filteredModelRankings = useMemo(() => {
    return modelRankings.filter((ranking) => effectiveSelectedIds.has(ranking.modelId));
  }, [modelRankings, effectiveSelectedIds]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          An overview of pathology foundation models performance across multiple benchmarks
        </p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Direct comparison</h1>
        <p className="mt-2 text-muted-foreground">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Scaling laws</h1>
          <p className="mt-2 text-muted-foreground">
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
