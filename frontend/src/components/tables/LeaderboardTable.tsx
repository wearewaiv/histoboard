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

  // Sort models based on current sort config
  const sortedRankings = useMemo(() => {
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
  }, [modelRankings, sortConfig, benchmarkIntegerRanks]);

  const handleSort = (benchmarkId: string) => {
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Organization
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
                {benchmarks.map((benchmark) => {
                  const integerRank = benchmarkIntegerRanks[benchmark.id]?.get(ranking.modelId as string);
                  const avgRank = ranking[benchmark.id];
                  const medal = integerRank ? getMedal(integerRank) : null;

                  return (
                    <td key={benchmark.id} className="px-4 py-3 text-center">
                      {avgRank !== undefined && typeof avgRank === "number" ? (
                        <div className="flex items-center justify-center gap-1">
                          {medal && <span className="text-lg">{medal}</span>}
                          <Badge
                            variant={integerRank && integerRank <= 3 ? "default" : "secondary"}
                            className={cn(
                              integerRank === 1 && "bg-yellow-500 hover:bg-yellow-600",
                              integerRank === 2 && "bg-gray-400 hover:bg-gray-500",
                              integerRank === 3 && "bg-amber-600 hover:bg-amber-700"
                            )}
                          >
                            {avgRank.toFixed(2)}
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
