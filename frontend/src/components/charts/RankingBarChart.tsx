"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ModelRanking } from "@/types";

interface RankingBarChartProps {
  rankings: ModelRanking[];
  maxModels?: number;
}

const COLORS = [
  "#16a34a", // green-600
  "#22c55e", // green-500
  "#4ade80", // green-400
  "#86efac", // green-300
  "#fbbf24", // yellow-400
  "#f59e0b", // amber-500
  "#fb923c", // orange-400
  "#f87171", // red-400
  "#ef4444", // red-500
  "#dc2626", // red-600
];

export function RankingBarChart({
  rankings,
  maxModels = 10,
}: RankingBarChartProps) {
  const data = rankings.slice(0, maxModels).map((r, i) => ({
    name: r.modelName,
    meanRank: r.meanRank,
    fill: COLORS[Math.min(i, COLORS.length - 1)],
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          domain={[0, "auto"]}
          label={{
            value: "Mean Rank (lower is better)",
            position: "insideBottom",
            offset: -5,
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number | undefined) =>
            value !== undefined ? [value.toFixed(2), "Mean Rank"] : ["-", "Mean Rank"]
          }
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="meanRank" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
