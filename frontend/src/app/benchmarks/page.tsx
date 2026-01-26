"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

import benchmarksData from "@/data/benchmarks.json";
import tasksData from "@/data/tasks.json";

import type { Benchmark, Task } from "@/types";

const benchmarks = benchmarksData as Benchmark[];
const tasks = tasksData as Task[];

const categoryColors: Record<string, string> = {
  "patch-level": "bg-blue-100 text-blue-800",
  "slide-level": "bg-purple-100 text-purple-800",
  survival: "bg-red-100 text-red-800",
  segmentation: "bg-green-100 text-green-800",
  retrieval: "bg-yellow-100 text-yellow-800",
  robustness: "bg-orange-100 text-orange-800",
};

export default function BenchmarksPage() {
  const tasksByBenchmark = tasks.reduce((acc, task) => {
    if (!acc[task.benchmarkId]) {
      acc[task.benchmarkId] = [];
    }
    acc[task.benchmarkId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Benchmark Sources</h1>
        <p className="mt-2 text-muted-foreground">
          Data is aggregated from {benchmarks.length} benchmark sources covering
          multiple evaluation categories
        </p>
      </div>

      <div className="grid gap-6">
        {benchmarks.map((benchmark) => {
          const benchmarkTasks = tasksByBenchmark[benchmark.id] || [];
          return (
            <Card key={benchmark.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {benchmark.name}
                      <Badge className={categoryColors[benchmark.category] || ""}>
                        {benchmark.category}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {benchmark.description}
                    </CardDescription>
                  </div>
                  <a
                    href={benchmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Source
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Organs Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {benchmark.organs.map((organ) => (
                        <Badge key={organ} variant="outline" className="capitalize">
                          {organ}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Tasks ({benchmarkTasks.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {benchmarkTasks.slice(0, 5).map((task) => (
                        <Badge key={task.id} variant="secondary">
                          {task.name}
                        </Badge>
                      ))}
                      {benchmarkTasks.length > 5 && (
                        <Badge variant="secondary">
                          +{benchmarkTasks.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attribution */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Data Attribution</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            Histoboard aggregates publicly available benchmark results to provide
            a unified view of pathology foundation model performance. All data
            is sourced from the original benchmark publications and websites.
          </p>
          <p className="mt-4">
            If you use Histoboard in your research, please cite the original
            benchmark sources. If you believe any data is incorrect or missing,
            please open an issue on our GitHub repository.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
