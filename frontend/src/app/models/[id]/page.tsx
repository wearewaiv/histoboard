import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeModelRankings } from "@/lib/ranking";
import { formatNumber } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Trophy } from "lucide-react";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";

import type { Model, Task, Result, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];

export function generateStaticParams() {
  return models.map((model) => ({
    id: model.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { id: modelId } = await params;

  const model = models.find((m) => m.id === modelId);
  const rankings = computeModelRankings(models, tasks, results);
  const ranking = rankings.find((r) => r.modelId === modelId);
  const modelResults = results.filter((r) => r.modelId === modelId);

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Model not found</p>
            <Link href="/models" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Models
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const benchmarkMap = new Map(benchmarks.map((b) => [b.id, b]));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/models" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Models
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{model.name}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{model.organization}</p>
        </div>
        {ranking && (
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <div className="text-3xl font-bold">#{ranking.overallRank}</div>
              <div className="text-sm text-muted-foreground">Overall Rank</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Model Info */}
        <Card>
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Architecture</dt>
                <dd className="font-medium">{model.architecture}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Parameters</dt>
                <dd className="font-medium">{model.params}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Pretraining Data</dt>
                <dd className="font-medium">{model.pretrainingData}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Publication Date</dt>
                <dd className="font-medium">{model.publicationDate}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {model.paperUrl && (
                <a href={model.paperUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Paper
                  </Button>
                </a>
              )}
              {model.codeUrl && (
                <a href={model.codeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Code
                  </Button>
                </a>
              )}
              {model.weightsUrl && (
                <a href={model.weightsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Weights
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ranking Summary */}
        {ranking && (
          <Card>
            <CardHeader>
              <CardTitle>Ranking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Mean Rank</dt>
                  <dd className="text-2xl font-bold">{formatNumber(ranking.meanRank, 2)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Median Rank</dt>
                  <dd className="text-2xl font-bold">{formatNumber(ranking.medianRank, 2)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tasks Evaluated</dt>
                  <dd className="text-2xl font-bold">{ranking.tasksEvaluated}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {ranking && (
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {Object.entries(ranking.ranksByCategory).map(([category, rank]) => (
                  <div key={category} className="flex items-center justify-between">
                    <dt className="text-sm capitalize">{category.replace("-", " ")}</dt>
                    <dd>
                      {rank !== null ? (
                        <Badge variant="secondary">{formatNumber(rank, 2)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Task Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Benchmark</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Organ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Rank</th>
                </tr>
              </thead>
              <tbody>
                {modelResults.map((result) => {
                  const task = taskMap.get(result.taskId);
                  const benchmark = task ? benchmarkMap.get(task.benchmarkId) : null;
                  return (
                    <tr key={result.taskId} className="border-b">
                      <td className="px-4 py-3 text-sm font-medium">
                        {task?.name || result.taskId}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {benchmark?.shortName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {task?.organ || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{formatNumber(result.value, 3)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={result.rank <= 3 ? "default" : "secondary"}>
                          #{result.rank}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
