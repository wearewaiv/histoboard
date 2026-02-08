"use client";

/**
 * Leaderboard Table
 *
 * Main ranking table on the /leaderboard page. Shows models as rows and
 * benchmarks as columns, with each cell displaying the model's average rank
 * for that benchmark. Supports sorting by any column and medal badges (gold,
 * silver, bronze) for top-3 models per benchmark.
 *
 * Used by: app/leaderboard/page.tsx
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Model, Benchmark } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";

interface ModelRanking {
  modelId: string;
  [benchmarkId: string]: number | string | undefined;
}

interface LeaderboardTableProps {
  modelRankings: ModelRanking[];
  models: Model[];
  benchmarks: Benchmark[];
}

type SortConfig = {
  benchmarkId: string;
  direction: "asc" | "desc";
} | null;

function getMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function getLicenseBadge(license: string): { label: string; className: string } {
  switch (license) {
    case "open-source":
      return { label: "Open", className: "bg-green-100 text-green-700 border-green-200" };
    case "non-commercial":
      return { label: "NC", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "closed-source":
      return { label: "Closed", className: "bg-gray-100 text-gray-600 border-gray-200" };
    default:
      return { label: license, className: "bg-gray-100 text-gray-600 border-gray-200" };
  }
}

export function LeaderboardTable({
  modelRankings,
  models,
  benchmarks,
}: LeaderboardTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [sortByBenchmarkCount, setSortByBenchmarkCount] = useState<"asc" | "desc" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const modelMap = new Map(models.map((m) => [m.id, m]));

  // Compute integer ranks per benchmark (1, 2, 3, ...) based on avgRank
  const benchmarkIntegerRanks = useMemo(() => {
    const ranks: Record<string, Map<string, number>> = {};

    for (const benchmark of benchmarks) {
      const modelsWithRank = modelRankings
        .filter((r) => {
          const avgRank = r[benchmark.id];
          return avgRank !== undefined && typeof avgRank === "number";
        })
        .sort((a, b) => {
          const rankA = a[benchmark.id] as number;
          const rankB = b[benchmark.id] as number;
          return rankA - rankB;
        });

      const rankMap = new Map<string, number>();
      modelsWithRank.forEach((r, index) => {
        rankMap.set(r.modelId as string, index + 1);
      });
      ranks[benchmark.id] = rankMap;
    }

    return ranks;
  }, [modelRankings, benchmarks]);

  // Count models per benchmark for column headers
  const benchmarkModelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const benchmark of benchmarks) {
      counts[benchmark.id] = benchmarkIntegerRanks[benchmark.id]?.size || 0;
    }
    return counts;
  }, [benchmarks, benchmarkIntegerRanks]);

  // Filter and sort models based on search query and sort config
  const sortedRankings = useMemo(() => {
    // First, filter by search query
    let filtered = modelRankings;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);
      filtered = modelRankings.filter((ranking) => {
        const model = modelMap.get(ranking.modelId as string);
        if (!model) return false;

        // Build searchable text from model properties
        const searchableText = [
          model.name,
          model.organization,
          model.architecture,
          model.params,
          model.license,
        ].filter(Boolean).join(" ").toLowerCase();

        // All query words must be present
        return queryWords.every((word) => searchableText.includes(word));
      });
    }

    // Then sort
    if (sortByBenchmarkCount) {
      return [...filtered].sort((a, b) => {
        const countA = (a.benchmarkCount as number) || 0;
        const countB = (b.benchmarkCount as number) || 0;
        return sortByBenchmarkCount === "asc" ? countA - countB : countB - countA;
      });
    }

    if (!sortConfig) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const rankA = benchmarkIntegerRanks[sortConfig.benchmarkId]?.get(a.modelId as string);
      const rankB = benchmarkIntegerRanks[sortConfig.benchmarkId]?.get(b.modelId as string);

      // Models without rank go to the bottom
      if (rankA === undefined && rankB === undefined) return 0;
      if (rankA === undefined) return 1;
      if (rankB === undefined) return -1;

      return sortConfig.direction === "asc" ? rankA - rankB : rankB - rankA;
    });
  }, [modelRankings, sortConfig, sortByBenchmarkCount, benchmarkIntegerRanks, searchQuery, modelMap]);

  const handleSort = (benchmarkId: string) => {
    setSortByBenchmarkCount(null); // Clear benchmark count sort
    setSortConfig((prev) => {
      if (prev?.benchmarkId === benchmarkId) {
        // Toggle direction or clear
        if (prev.direction === "asc") {
          return { benchmarkId, direction: "desc" };
        }
        return null;
      }
      return { benchmarkId, direction: "asc" };
    });
  };

  const handleBenchmarkCountSort = () => {
    setSortConfig(null); // Clear benchmark sort
    setSortByBenchmarkCount((prev) => {
      if (prev === null) return "desc"; // Default to descending (most benchmarks first)
      if (prev === "desc") return "asc";
      return null;
    });
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search models by name, organization, architecture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {sortedRankings.length} of {modelRankings.length} models
          </p>
        )}
      </div>

      <div className="relative">
        {/* Scroll indicator for mobile */}
        <div className="table-scroll-indicator" />
        <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full border-collapse text-xs md:text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted">
              <th className="sticky left-0 z-30 bg-muted px-2 md:px-4 py-2 md:py-3 text-left font-semibold min-w-[140px] md:min-w-[180px]">Model</th>
            {benchmarks.map((benchmark) => (
              <th
                key={benchmark.id}
                className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold"
              >
                <button
                  onClick={() => handleSort(benchmark.id)}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  title={`Sort by ${benchmark.shortName} rank`}
                >
                  <a
                    href={benchmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {benchmark.shortName}
                  </a>
                  <span className="flex flex-col">
                    <ChevronUp
                      className={cn(
                        "h-3 w-3 -mb-1",
                        sortConfig?.benchmarkId === benchmark.id &&
                          sortConfig.direction === "asc"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <ChevronDown
                      className={cn(
                        "h-3 w-3",
                        sortConfig?.benchmarkId === benchmark.id &&
                          sortConfig.direction === "desc"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                      )}
                    />
                  </span>
                </button>
              </th>
            ))}
              <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold">
                <button
                  onClick={handleBenchmarkCountSort}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  title="Sort by number of benchmarks"
                >
                  <span className="hidden md:inline"># Benchmarks</span>
                  <span className="md:hidden">#</span>
                  <span className="flex flex-col">
                    <ChevronUp
                      className={cn(
                        "h-3 w-3 -mb-1",
                        sortByBenchmarkCount === "asc"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <ChevronDown
                      className={cn(
                        "h-3 w-3",
                        sortByBenchmarkCount === "desc"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                      )}
                    />
                  </span>
                </button>
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left font-semibold">
                Organization
              </th>
          </tr>
        </thead>
        <tbody>
          {sortedRankings.map((ranking) => {
            const model = modelMap.get(ranking.modelId as string);
            if (!model) return null;

            return (
              <tr
                key={ranking.modelId as string}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="sticky left-0 z-10 bg-background px-2 md:px-4 py-2 md:py-3 border-r">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Link
                      href={`/models/${ranking.modelId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {model.name}
                    </Link>
                    {model.license && (
                      <span
                        className={cn(
                          "hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border",
                          getLicenseBadge(model.license).className
                        )}
                        title={model.license === "non-commercial" ? "Non-commercial license" : model.license === "open-source" ? "Open source" : "Closed source"}
                      >
                        {getLicenseBadge(model.license).label}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">
                    {model.architecture} ({model.params})
                  </div>
                </td>
                {benchmarks.map((benchmark) => {
                  const integerRank = benchmarkIntegerRanks[benchmark.id]?.get(ranking.modelId as string);
                  const total = benchmarkModelCounts[benchmark.id];
                  const medal = integerRank ? getMedal(integerRank) : null;

                  return (
                    <td key={benchmark.id} className="px-2 md:px-4 py-2 md:py-3 text-center">
                      {integerRank !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {medal && <span className="text-lg">{medal}</span>}
                          <Badge
                            variant={integerRank <= 3 ? "default" : "secondary"}
                            className={cn(
                              integerRank === 1 && "bg-yellow-500 hover:bg-yellow-600",
                              integerRank === 2 && "bg-gray-400 hover:bg-gray-500",
                              integerRank === 3 && "bg-amber-600 hover:bg-amber-700"
                            )}
                          >
                            {integerRank}<span className="text-[0.7em] opacity-70">/{total}</span>
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                  <Badge variant="outline" className="font-medium">
                    {ranking.benchmarkCount || 0}
                  </Badge>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                  {model.organization}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
