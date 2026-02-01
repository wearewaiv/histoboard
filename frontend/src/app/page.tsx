"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Database, BarChart3, Award, TrendingUp } from "lucide-react";
import { ScalingLawsChart } from "@/components/charts/ScalingLawsChart";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";
import resultsData from "@/data/results.json";

import type { Model, Task, Benchmark, Result } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;
const results = resultsData as Result[];

export default function HomePage() {
  const stats = {
    models: models.length,
    tasks: tasks.length,
    benchmarks: benchmarks.length,
    organs: [...new Set(tasks.map((t) => t.organ))].length,
  };

  // Models to exclude from rankings (e.g., benchmark-specific baselines)
  const EXCLUDED_MODEL_IDS = new Set(["hest_uni_1_5"]);

  // Get top 5 models for each benchmark
  const getTopModels = (benchmarkId: string, limit: number = 5) => {
    return Object.entries(rankings[benchmarkId] || {})
      .filter(([modelId]) => !EXCLUDED_MODEL_IDS.has(modelId))
      .sort((a, b) => a[1].avgRank - b[1].avgRank)
      .slice(0, limit)
      .map(([modelId, data], index) => ({
        modelId,
        rank: index + 1,
        avgRank: data.avgRank,
        model: models.find(m => m.id === modelId),
      }));
  };

  // Get top 3 for each benchmark
  const podiums = benchmarks.map(benchmark => ({
    benchmark,
    topModels: getTopModels(benchmark.id, 3),
  }));

  const MEDALS = ["🥇", "🥈", "🥉"];

  // Podium Card Component (shows top 3 with medals)
  const PodiumCard = ({ benchmark, topModels }: { benchmark: Benchmark; topModels: ReturnType<typeof getTopModels> }) => {
    if (topModels.length === 0) return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {benchmark.shortName}
            {(benchmark.id === "pathorob" || benchmark.id === "plism") && (
              <span className="ml-1 text-[10px]">(robustness)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {topModels.map((entry, idx) => (
            <div key={entry.modelId} className="flex items-center gap-2">
              <span className="text-base">{MEDALS[idx]}</span>
              <Link
                href={`/models/${entry.modelId}`}
                className="text-sm font-medium text-primary hover:underline truncate"
              >
                {entry.model?.name || entry.modelId}
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Pathology Foundation Model Leaderboard
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          A centralized dashboard aggregating benchmark results to compare
          pathology foundation models.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/leaderboard">
            <Button size="lg">
              <Trophy className="mr-2 h-5 w-5" />
              View Full Leaderboard
            </Button>
          </Link>
          <Link href="/benchmarks">
            <Button variant="outline" size="lg">
              <Database className="mr-2 h-5 w-5" />
              Data Sources
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-12 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.models}</div>
            <p className="text-xs text-muted-foreground">
              Foundation models evaluated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks}</div>
            <p className="text-xs text-muted-foreground">
              Benchmark tasks tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benchmarks</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.benchmarks}</div>
            <p className="text-xs text-muted-foreground">Data sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organs</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organs}</div>
            <p className="text-xs text-muted-foreground">Tissue types covered</p>
          </CardContent>
        </Card>
      </section>

      {/* Champion Board */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Award className="h-5 w-5 text-yellow-500" />
            Champion Board
          </h2>
          <Link
            href="/benchmarks"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            View all benchmarks &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {podiums.map(({ benchmark, topModels }) => (
            <PodiumCard key={benchmark.id} benchmark={benchmark} topModels={topModels} />
          ))}
        </div>
      </section>

      {/* Scaling Laws */}
      <section className="mb-12">
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <TrendingUp className="h-6 w-6" />
          Scaling Laws
        </h2>
        <p className="mb-6 text-muted-foreground">
          Relationship between robustness and performance.
          Per-benchmark average metrics were normalized within [0, 1]. Point size represents model parameters.
          Only models evaluated on the selected benchmarks are shown.
        </p>
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
    </div>
  );
}
