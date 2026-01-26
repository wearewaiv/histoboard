"use client";

import React from "react";
import Link from "next/link";
import type { ModelRanking, Model } from "@/types";
import { cn, formatNumber, getRankColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy, Medal, Award } from "lucide-react";

interface LeaderboardTableProps {
  rankings: ModelRanking[];
  models: Model[];
  showDetails?: boolean;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return null;
}

export function LeaderboardTable({
  rankings,
  models,
  showDetails = false,
}: LeaderboardTableProps) {
  const modelMap = new Map(models.map((m) => [m.id, m]));
  const totalModels = rankings.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Organization
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Mean Rank
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Median Rank
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Tasks
            </th>
            {showDetails && (
              <>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Patch
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Slide
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Survival
                </th>
              </>
            )}
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Links
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking, index) => {
            const model = modelMap.get(ranking.modelId);
            if (!model) return null;

            return (
              <tr
                key={ranking.modelId}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50",
                  index < 3 && "bg-gradient-to-r from-yellow-50/50 to-transparent"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                        getRankColor(ranking.overallRank, totalModels)
                      )}
                    >
                      {ranking.overallRank}
                    </span>
                    {getRankIcon(ranking.overallRank)}
                  </div>
                </td>
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
                  <Badge variant="secondary">
                    {formatNumber(ranking.meanRank, 2)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm">
                    {formatNumber(ranking.medianRank, 2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium">
                    {ranking.tasksEvaluated}
                  </span>
                </td>
                {showDetails && (
                  <>
                    <td className="px-4 py-3 text-center text-sm">
                      {ranking.ranksByCategory["patch-level"]
                        ? formatNumber(ranking.ranksByCategory["patch-level"], 1)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {ranking.ranksByCategory["slide-level"]
                        ? formatNumber(ranking.ranksByCategory["slide-level"], 1)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {ranking.ranksByCategory["survival"]
                        ? formatNumber(ranking.ranksByCategory["survival"], 1)
                        : "-"}
                    </td>
                  </>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {model.paperUrl && (
                      <a
                        href={model.paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title="Paper"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {model.codeUrl && (
                      <a
                        href={model.codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title="Code"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
