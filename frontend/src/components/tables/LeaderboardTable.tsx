"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Model, Benchmark } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";

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

export function LeaderboardTable({
  modelRankings,
  models,
  benchmarks,
}: LeaderboardTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [sortByBenchmarkCount, setSortByBenchmarkCount] = useState<"asc" | "desc" | null>(null);
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

  // Sort models based on current sort config
  const sortedRankings = useMemo(() => {
    if (sortByBenchmarkCount) {
      return [...modelRankings].sort((a, b) => {
        const countA = (a.benchmarkCount as number) || 0;
        const countB = (b.benchmarkCount as number) || 0;
        return sortByBenchmarkCount === "asc" ? countA - countB : countB - countA;
      });
    }

    if (!sortConfig) {
      return modelRankings;
    }

    return [...modelRankings].sort((a, b) => {
      const rankA = benchmarkIntegerRanks[sortConfig.benchmarkId]?.get(a.modelId as string);
      const rankB = benchmarkIntegerRanks[sortConfig.benchmarkId]?.get(b.modelId as string);

      // Models without rank go to the bottom
      if (rankA === undefined && rankB === undefined) return 0;
      if (rankA === undefined) return 1;
      if (rankB === undefined) return -1;

      return sortConfig.direction === "asc" ? rankA - rankB : rankB - rankA;
    });
  }, [modelRankings, sortConfig, sortByBenchmarkCount, benchmarkIntegerRanks]);

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
    <div className="overflow-x-auto max-h-[70vh]">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="border-b bg-muted">
            <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Organization
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              <button
                onClick={handleBenchmarkCountSort}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                title="Sort by number of benchmarks"
              >
                # Benchmarks
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
            {benchmarks.map((benchmark) => (
              <th
                key={benchmark.id}
                className="px-4 py-3 text-center text-sm font-semibold"
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
                <td className="px-4 py-3">
                  <Link
                    href={`/models/${ranking.modelId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {model.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {model.architecture} ({model.params})
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {model.organization}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className="font-medium">
                    {ranking.benchmarkCount || 0}
                  </Badge>
                </td>
                {benchmarks.map((benchmark) => {
                  const integerRank = benchmarkIntegerRanks[benchmark.id]?.get(ranking.modelId as string);
                  const total = benchmarkModelCounts[benchmark.id];
                  const medal = integerRank ? getMedal(integerRank) : null;

                  return (
                    <td key={benchmark.id} className="px-4 py-3 text-center">
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
