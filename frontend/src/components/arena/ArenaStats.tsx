"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { Model } from "@/types";

interface ModelStats {
  avgRank: number;
  avgValue: number;
  taskCount: number;
  wins: number;
  ties: number;
  losses: number;
}

interface ArenaStatsProps {
  selectedModels: Model[];
  modelStats: Map<string, ModelStats>;
}

export function ArenaStats({ selectedModels, modelStats }: ArenaStatsProps) {
  // Sort models by average rank (lower is better)
  const sortedModels = [...selectedModels].sort((a, b) => {
    const statsA = modelStats.get(a.id);
    const statsB = modelStats.get(b.id);
    if (!statsA || !statsB) return 0;
    return statsA.avgRank - statsB.avgRank;
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-4 py-3 text-left font-semibold">Rank</th>
                <th className="px-4 py-3 text-left font-semibold">Model</th>
                <th className="px-4 py-3 text-center font-semibold">Average rank</th>
                <th className="px-4 py-3 text-center font-semibold">Tasks</th>
                <th className="px-4 py-3 text-center font-semibold text-green-600">Wins</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500">Ties</th>
                <th className="px-4 py-3 text-center font-semibold text-red-600">Losses</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((model, idx) => {
                const stats = modelStats.get(model.id);
                if (!stats) return null;

                const total = stats.wins + stats.ties + stats.losses;
                const winRate = total > 0 ? (stats.wins / total) * 100 : 0;

                return (
                  <tr
                    key={model.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        idx === 0 && "bg-amber-100 text-amber-800",
                        idx === 1 && "bg-gray-200 text-gray-700",
                        idx === 2 && "bg-orange-100 text-orange-800",
                        idx > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/models/${model.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {model.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {model.organization}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums font-semibold">
                      {formatNumber(stats.avgRank, 2)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {stats.taskCount}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-green-600 font-medium">
                      {stats.wins}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-gray-500">
                      {stats.ties}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-red-600 font-medium">
                      {stats.losses}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual win rate bars */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Win Rate Distribution</h4>
          {sortedModels.map((model) => {
            const stats = modelStats.get(model.id);
            if (!stats) return null;

            const total = stats.wins + stats.ties + stats.losses;
            const winPct = total > 0 ? (stats.wins / total) * 100 : 0;
            const tiePct = total > 0 ? (stats.ties / total) * 100 : 0;
            const lossPct = total > 0 ? (stats.losses / total) * 100 : 0;

            return (
              <div key={model.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(winPct, 1)}% wins
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${winPct}%` }}
                  />
                  <div
                    className="h-full bg-gray-400 transition-all"
                    style={{ width: `${tiePct}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${lossPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
