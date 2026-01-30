"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Database } from "lucide-react";

import benchmarksData from "@/data/benchmarks.json";
import tasksData from "@/data/tasks.json";

import type { Benchmark, Task } from "@/types";

const benchmarks = benchmarksData as Benchmark[];
const tasks = tasksData as Task[];

const categoryColors: Record<string, string> = {
  "pathology": "bg-blue-100 text-blue-800",
  "radiology": "bg-cyan-100 text-cyan-800",
  "spatial-transcriptomics": "bg-purple-100 text-purple-800",
  "patch-level": "bg-blue-100 text-blue-800",
  "slide-level": "bg-purple-100 text-purple-800",
  survival: "bg-red-100 text-red-800",
  segmentation: "bg-green-100 text-green-800",
  retrieval: "bg-yellow-100 text-yellow-800",
  robustness: "bg-orange-100 text-orange-800",
  "H&E": "bg-pink-100 text-pink-800",
};

// Extract base task name (before parentheses) for PathBench grouping
function getBaseTaskName(name: string): string {
  const match = name.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : name;
}

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
                      {Array.isArray(benchmark.category) ? (
                        benchmark.category.map((cat) => (
                          <Badge key={cat} className={categoryColors[cat] || ""}>
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <Badge className={categoryColors[benchmark.category] || ""}>
                          {benchmark.category}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {benchmark.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {benchmark.paperUrl && (
                      <a
                        href={benchmark.paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Paper
                        </Button>
                      </a>
                    )}
                    {benchmark.datasetUrl && (
                      <a
                        href={benchmark.datasetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">
                          <Database className="mr-2 h-4 w-4" />
                          Dataset
                        </Button>
                      </a>
                    )}
                    <a
                      href={benchmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Source
                      </Button>
                    </a>
                  </div>
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
                      Tasks ({benchmark.taskCount})
                    </h4>
                    {benchmark.id === "stanford" ? (
                      // Group Stanford tasks by TaskCategory
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          benchmarkTasks.reduce((acc, task) => {
                            const cat = task.category as string;
                            if (!acc[cat]) acc[cat] = 0;
                            acc[cat]++;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([category, count]) => (
                            <Badge
                              key={category}
                              variant="secondary"
                            >
                              {category} ({count})
                            </Badge>
                          ))}
                      </div>
                    ) : benchmark.id === "hest" ? (
                      // HEST has 1 task type across 9 datasets
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Gene expression prediction (9)
                        </Badge>
                      </div>
                    ) : benchmark.id === "pathobench" ? (
                      // Patho-Bench task categories from HuggingFace
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Mutation Prediction (34)</Badge>
                        <Badge variant="secondary">TME Characterization (16)</Badge>
                        <Badge variant="secondary">Survival Prediction (12)</Badge>
                        <Badge variant="secondary">Morphological Subtyping (11)</Badge>
                        <Badge variant="secondary">Tumor Grading (9)</Badge>
                        <Badge variant="secondary">Treatment Response (7)</Badge>
                        <Badge variant="secondary">Molecular Subtyping (6)</Badge>
                      </div>
                    ) : benchmark.id === "sinai" ? (
                      // Sinai SSL Tile Benchmarks categories with detailed biomarker breakdown
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Cancer Detection (9)</Badge>
                        <Badge variant="secondary">ER status (1)</Badge>
                        <Badge variant="secondary">PR status (1)</Badge>
                        <Badge variant="secondary">HER2 status (1)</Badge>
                        <Badge variant="secondary">HRD (1)</Badge>
                        <Badge variant="secondary">EGFR (1)</Badge>
                        <Badge variant="secondary">ALK (1)</Badge>
                        <Badge variant="secondary">STK11 (1)</Badge>
                        <Badge variant="secondary">KRAS (1)</Badge>
                        <Badge variant="secondary">TP53 (1)</Badge>
                        <Badge variant="secondary">BRAF (1)</Badge>
                        <Badge variant="secondary">NRAS (1)</Badge>
                        <Badge variant="secondary">ICI response (1)</Badge>
                      </div>
                    ) : benchmark.id === "stamp" ? (
                      // Group STAMP tasks by category (Morphology, Biomarker, Prognosis)
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          benchmarkTasks.reduce((acc, task) => {
                            const cat = task.category as string;
                            if (!acc[cat]) acc[cat] = 0;
                            acc[cat]++;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([category, count]) => (
                            <Badge
                              key={category}
                              variant="secondary"
                            >
                              {category} ({count})
                            </Badge>
                          ))}
                      </div>
                    ) : benchmark.id === "pathbench" ? (
                      // Group PathBench tasks by base name (ignoring dataset variations)
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          benchmarkTasks.reduce((acc, task) => {
                            const baseName = getBaseTaskName(task.name);
                            if (!acc[baseName]) acc[baseName] = 0;
                            acc[baseName]++;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 10)
                          .map(([baseName, count]) => (
                            <Badge
                              key={baseName}
                              variant="secondary"
                            >
                              {baseName} ({count})
                            </Badge>
                          ))}
                        {Object.keys(
                          benchmarkTasks.reduce((acc, task) => {
                            const baseName = getBaseTaskName(task.name);
                            acc[baseName] = true;
                            return acc;
                          }, {} as Record<string, boolean>)
                        ).length > 10 && (
                          <Badge variant="secondary">
                            +{Object.keys(
                              benchmarkTasks.reduce((acc, task) => {
                                const baseName = getBaseTaskName(task.name);
                                acc[baseName] = true;
                                return acc;
                              }, {} as Record<string, boolean>)
                            ).length - 10} more task types
                          </Badge>
                        )}
                      </div>
                    ) : (
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
                    )}
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
