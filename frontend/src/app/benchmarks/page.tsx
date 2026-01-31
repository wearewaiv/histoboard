"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileText, Database, Search, Star } from "lucide-react";

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

// Parse GitHub URL to get owner/repo
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

// Format star count (e.g., 1234 -> "1.2k")
function formatStars(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return count.toString();
}

// Get PathBench task type (Classification, OS, DFS, DSS)
function getPathBenchTaskType(task: Task): string {
  if (task.category === "Classification" || task.category === "classification") {
    return "Classification";
  }
  const name = task.name.toLowerCase();
  if (name.includes("overall survival")) return "OS";
  if (name.includes("disease-free survival")) return "DFS";
  if (name.includes("disease-specific survival")) return "DSS";
  return "Classification";
}

const PATHBENCH_TYPE_LABELS: Record<string, string> = {
  "Classification": "Classification",
  "OS": "OS (Overall Survival)",
  "DFS": "DFS (Disease-free Survival)",
  "DSS": "DSS (Disease-specific Survival)",
};

export default function BenchmarksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [starCounts, setStarCounts] = useState<Record<string, number>>({});
  const [starsLoading, setStarsLoading] = useState(true);

  // Fetch GitHub stars for all benchmarks
  useEffect(() => {
    const fetchAllStars = async () => {
      const stars: Record<string, number> = {};
      const cacheExpiry = 1000 * 60 * 60; // 1 hour cache

      await Promise.all(
        benchmarks.map(async (benchmark) => {
          if (!benchmark.githubUrl) return;

          const parsed = parseGitHubUrl(benchmark.githubUrl);
          if (!parsed) return;

          const { owner, repo } = parsed;
          const cacheKey = `github-stars-${owner}-${repo}`;

          // Check localStorage cache first
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const { stars: cachedStars, timestamp } = JSON.parse(cached);
              if (Date.now() - timestamp < cacheExpiry) {
                stars[benchmark.id] = cachedStars;
                return;
              }
            } catch {
              // Invalid cache, continue to fetch
            }
          }

          // Fetch from GitHub API
          try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (res.ok) {
              const data = await res.json();
              const starCount = data.stargazers_count;
              stars[benchmark.id] = starCount;
              // Cache the result
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ stars: starCount, timestamp: Date.now() })
              );
            }
          } catch {
            // Silently fail for individual repos
          }
        })
      );

      setStarCounts(stars);
      setStarsLoading(false);
    };

    fetchAllStars();
  }, []);

  const tasksByBenchmark = tasks.reduce((acc, task) => {
    if (!acc[task.benchmarkId]) {
      acc[task.benchmarkId] = [];
    }
    acc[task.benchmarkId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Filter and sort benchmarks (by star count descending, then by name)
  const filteredBenchmarks = useMemo(() => {
    let filtered = benchmarks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      filtered = benchmarks.filter((benchmark) => {
        const benchmarkTasks = tasksByBenchmark[benchmark.id] || [];

        // Searchable fields
        const searchableText = [
          benchmark.name,
          benchmark.shortName,
          benchmark.description,
          ...(Array.isArray(benchmark.category) ? benchmark.category : [benchmark.category]),
          ...benchmark.organs,
          ...benchmarkTasks.map((t) => t.name),
          ...benchmarkTasks.map((t) => t.category as string),
          ...benchmarkTasks.map((t) => t.organ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Match if all query words are found in searchable text
        return queryWords.every((word) => searchableText.includes(word));
      });
    }

    // Sort by star count (descending), benchmarks without stars go last
    return [...filtered].sort((a, b) => {
      const starsA = starCounts[a.id] ?? -1;
      const starsB = starCounts[b.id] ?? -1;
      if (starsA !== starsB) return starsB - starsA;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, tasksByBenchmark, starCounts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Benchmark Sources</h1>
        <p className="mt-2 text-muted-foreground">
          Data is aggregated from {benchmarks.length} benchmark sources covering
          multiple evaluation categories
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search benchmarks by name, organ, task, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {filteredBenchmarks.length} of {benchmarks.length} benchmarks
          </p>
        )}
      </div>

      <div className="grid gap-6">
        {filteredBenchmarks.map((benchmark) => {
          const benchmarkTasks = tasksByBenchmark[benchmark.id] || [];
          return (
            <Card key={benchmark.id} className="relative">
              {benchmark.githubUrl && starCounts[benchmark.id] !== undefined && (
                <a
                  href={benchmark.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-4 top-4 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  title={`${starCounts[benchmark.id]} GitHub stars`}
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{formatStars(starCounts[benchmark.id])}</span>
                </a>
              )}
              {benchmark.githubUrl && starCounts[benchmark.id] === undefined && starsLoading && (
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-xs">...</span>
                </div>
              )}
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="pr-16">
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
                    {benchmark.id === "pathbench" ? (
                      // PathBench: show 4 task types (Classification, OS, DFS, DSS)
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          benchmarkTasks.reduce((acc, task) => {
                            const type = getPathBenchTaskType(task);
                            if (!acc[type]) acc[type] = 0;
                            acc[type]++;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => (
                            <Badge key={type} variant="secondary">
                              {PATHBENCH_TYPE_LABELS[type] || type} ({count})
                            </Badge>
                          ))}
                      </div>
                    ) : benchmarkTasks.length < 10 ? (
                      // Show all tasks individually if less than 10
                      <div className="flex flex-wrap gap-2">
                        {benchmarkTasks.map((task) => (
                          <Badge key={task.id} variant="secondary">
                            {task.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      // Show task categories if 10 or more tasks
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
