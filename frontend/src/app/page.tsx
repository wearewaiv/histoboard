"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Database, BarChart3, ArrowRight, Award } from "lucide-react";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";

import type { Model, Task, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

export default function HomePage() {
  const stats = {
    models: models.length,
    tasks: tasks.length,
    benchmarks: benchmarks.length,
    organs: [...new Set(tasks.map((t) => t.organ))].length,
  };

  // Get top 5 models for each benchmark
  const getTopModels = (benchmarkId: string, limit: number = 5) => {
    return Object.entries(rankings[benchmarkId] || {})
      .sort((a, b) => a[1].avgRank - b[1].avgRank)
      .slice(0, limit)
      .map(([modelId, data], index) => ({
        modelId,
        rank: index + 1,
        avgRank: data.avgRank,
        model: models.find(m => m.id === modelId),
      }));
  };

  // Get champion (top 1) for each benchmark
  const champions = benchmarks.map(benchmark => ({
    benchmark,
    topModel: getTopModels(benchmark.id, 1)[0],
  }));

  // Champion Card Component
  const ChampionCard = ({ benchmark, topModel }: { benchmark: Benchmark; topModel: ReturnType<typeof getTopModels>[0] }) => {
    if (!topModel) return null;

    return (
      <Card className="relative overflow-hidden">
        <div className="absolute right-2 top-2">
          <Award className="h-5 w-5 text-yellow-500" />
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {benchmark.shortName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/models/${topModel.modelId}`}
            className="text-base font-semibold text-primary hover:underline"
          >
            {topModel.model?.name || topModel.modelId}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {topModel.model?.organization}
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Avg Rank: {topModel.avgRank.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    );
  };

  // Top 5 List Component
  const TopModelsList = ({ benchmarkId, benchmarkName }: { benchmarkId: string; benchmarkName: string }) => {
    const items = getTopModels(benchmarkId, 5);

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.modelId}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {item.rank}
              </span>
              <div>
                <Link
                  href={`/models/${item.modelId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {item.model?.name || item.modelId}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.model?.organization}
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {item.avgRank.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
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
          pathology foundation models using rank-based comparisons.
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

      {/* Top Performers by Benchmark */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Top Performers by Benchmark</h2>

        {/* Champion Board */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Award className="h-5 w-5 text-yellow-500" />
            Champion Board
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {champions.map(({ benchmark, topModel }) => (
              <ChampionCard key={benchmark.id} benchmark={benchmark} topModel={topModel} />
            ))}
          </div>
        </div>

        {/* Tabbed Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Rankings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Explore top 5 models for each benchmark
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={benchmarks[0].id}>
              <>
                <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
                  <>
                    {benchmarks.map((benchmark) => (
                      <TabsTrigger key={benchmark.id} value={benchmark.id}>
                        {benchmark.shortName}
                      </TabsTrigger>
                    ))}
                  </>
                </TabsList>
                {benchmarks.map((benchmark) => (
                  <TabsContent key={benchmark.id} value={benchmark.id}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{benchmark.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {benchmark.description}
                          </p>
                        </div>
                        <Link href="/leaderboard">
                          <Button variant="outline" size="sm">
                            View Full Leaderboard
                          </Button>
                        </Link>
                      </div>
                      <TopModelsList benchmarkId={benchmark.id} benchmarkName={benchmark.name} />
                    </div>
                  </TabsContent>
                ))}
              </>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Methodology */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Ranking Methodology</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              Models are ranked using a <strong>mean rank aggregation</strong>{" "}
              approach:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                For each task, models are ranked by performance (1 = best)
              </li>
              <li>Ties are handled using average rank assignment</li>
              <li>The mean rank across all tasks determines the ranking within each benchmark</li>
            </ol>
            <p className="mt-4">
              Visit the{" "}
              <Link href="/leaderboard" className="text-primary hover:underline">
                leaderboard page
              </Link>{" "}
              to see detailed results and compare models across benchmarks.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
