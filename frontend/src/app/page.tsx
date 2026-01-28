"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Database, BarChart3, ArrowRight } from "lucide-react";

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
  const getTopModels = (benchmarkId: string) => {
    return Object.entries(rankings[benchmarkId] || {})
      .sort((a, b) => a[1].avgRank - b[1].avgRank)
      .slice(0, 5)
      .map(([modelId, data], index) => ({
        modelId,
        rank: index + 1,
        avgRank: data.avgRank,
        model: models.find(m => m.id === modelId),
      }));
  };

  const topEvaModels = getTopModels("eva");
  const topPathbenchModels = getTopModels("pathbench");
  const topStanfordModels = getTopModels("stanford");
  const topHestModels = getTopModels("hest");
  const topPathobenchModels = getTopModels("pathobench");
  const topSinaiModels = getTopModels("sinai");
  const topStampModels = getTopModels("stamp");
  const topThunderModels = getTopModels("thunder");
  const topPathorobModels = getTopModels("pathorob");
  const topPlismModels = getTopModels("plism");

  const TopModelsList = ({ items, benchmarkName }: { items: typeof topEvaModels; benchmarkName: string }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Top 5 - {benchmarkName}
          </CardTitle>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.modelId}
              className="flex items-center justify-between border-b pb-2 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
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
              <span className="text-xs text-muted-foreground">
                {item.avgRank.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Top Performers per Benchmark */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Top Performers by Benchmark</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
          <TopModelsList items={topEvaModels} benchmarkName="EVA" />
          <TopModelsList items={topPathbenchModels} benchmarkName="PathBench" />
          <TopModelsList items={topStanfordModels} benchmarkName="Stanford" />
          <TopModelsList items={topHestModels} benchmarkName="HEST" />
          <TopModelsList items={topPathobenchModels} benchmarkName="Patho-Bench" />
          <TopModelsList items={topSinaiModels} benchmarkName="Sinai" />
          <TopModelsList items={topStampModels} benchmarkName="STAMP" />
          <TopModelsList items={topThunderModels} benchmarkName="THUNDER" />
          <TopModelsList items={topPathorobModels} benchmarkName="PathoROB" />
          <TopModelsList items={topPlismModels} benchmarkName="PLISM" />
        </div>
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
