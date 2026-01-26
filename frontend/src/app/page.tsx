"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { computeModelRankings } from "@/lib/ranking";
import { Trophy, Database, BarChart3, ArrowRight } from "lucide-react";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";

import type { Model, Task, Result, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];

export default function HomePage() {
  const rankings = computeModelRankings(models, tasks, results);
  const topRankings = rankings.slice(0, 5);

  const stats = {
    models: models.length,
    tasks: tasks.length,
    benchmarks: benchmarks.length,
    organs: [...new Set(tasks.map((t) => t.organ))].length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Pathology Foundation Model Leaderboard
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          A centralized dashboard aggregating benchmark results from 8+ sources
          to compare pathology foundation models using rank-based comparisons.
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

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingBarChart rankings={rankings} />
          </CardContent>
        </Card>

        {/* Top 5 Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <LeaderboardTable rankings={topRankings} models={models} />
          </CardContent>
        </Card>
      </div>

      {/* Methodology */}
      <section className="mt-12">
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
              <li>The mean rank across all tasks determines overall ranking</li>
            </ol>
            <p className="mt-4">
              Use filters on the{" "}
              <Link href="/leaderboard" className="text-primary hover:underline">
                leaderboard page
              </Link>{" "}
              to focus on specific task categories, organs, or benchmark sources.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
