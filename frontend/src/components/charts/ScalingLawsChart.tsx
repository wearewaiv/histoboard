"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  buildScalingLawsData,
  ALL_PERFORMANCE_BENCHMARKS,
  DEFAULT_SELECTED_BENCHMARKS,
  ALL_ROBUSTNESS_BENCHMARKS,
  DEFAULT_SELECTED_ROBUSTNESS,
  type ScalingLawsDataPoint,
} from "@/lib/scalingLaws";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import type { Model, Task, Result } from "@/types";

interface ScalingLawsChartProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
}

// Color palette for models (distinct colors)
const MODEL_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // violet
  "#10b981", // emerald
  "#eab308", // yellow
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#64748b", // slate
  "#78716c", // stone
  "#fb7185", // rose
  "#4ade80", // green-400
  "#60a5fa", // blue-400
  "#c084fc", // purple-400
  "#facc15", // yellow-400
  "#2dd4bf", // teal-400
  "#fb923c", // orange-400
  "#a78bfa", // violet-400
  "#38bdf8", // sky-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f472b6", // pink-400
  "#818cf8", // indigo-400
  "#4f46e5", // indigo-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
];

// Format params for display
function formatParams(params: number): string {
  if (params >= 1000) {
    return `${(params / 1000).toFixed(1)}B`;
  }
  return `${Math.round(params)}M`;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScalingLawsDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-white p-3 shadow-lg">
      <p className="font-semibold">{data.modelName}</p>
      <p className="text-sm text-muted-foreground">{data.organization}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Robustness:</span>{" "}
          {data.robustness.toFixed(3)}
        </p>
        <p>
          <span className="text-muted-foreground">Performance:</span>{" "}
          {data.performance.toFixed(3)}
        </p>
        <p>
          <span className="text-muted-foreground">Params:</span>{" "}
          {formatParams(data.params)}
        </p>
      </div>
    </div>
  );
}

// Size legend component
function SizeLegend({
  minParams,
  maxParams,
  minSize,
  maxSize,
}: {
  minParams: number;
  maxParams: number;
  minSize: number;
  maxSize: number;
}) {
  // Calculate intermediate values
  const midParams = (minParams + maxParams) / 2;
  const midSize = (minSize + maxSize) / 2;

  const legendItems = [
    { params: minParams, size: minSize },
    { params: midParams, size: midSize },
    { params: maxParams, size: maxSize },
  ];

  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      <span className="text-xs text-muted-foreground">Model size:</span>
      {legendItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <svg width={Math.sqrt(item.size) + 4} height={Math.sqrt(item.size) + 4}>
            <circle
              cx={(Math.sqrt(item.size) + 4) / 2}
              cy={(Math.sqrt(item.size) + 4) / 2}
              r={Math.sqrt(item.size) / 2}
              fill="#6b7280"
              fillOpacity={0.7}
            />
          </svg>
          <span className="text-xs text-muted-foreground">
            {formatParams(item.params)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScalingLawsChart({
  models,
  tasks,
  results,
}: ScalingLawsChartProps) {
  // Selected performance benchmarks state
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_BENCHMARKS)
  );

  // Selected robustness benchmarks state
  const [selectedRobustness, setSelectedRobustness] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_ROBUSTNESS)
  );

  // Toggle performance benchmark selection
  const toggleBenchmark = (id: string) => {
    setSelectedBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle robustness benchmark selection
  const toggleRobustness = (id: string) => {
    setSelectedRobustness((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build data points
  const dataPoints = useMemo(
    () => buildScalingLawsData(models, tasks, results, selectedBenchmarks, selectedRobustness),
    [models, tasks, results, selectedBenchmarks, selectedRobustness]
  );

  // Calculate point size range based on params
  const paramRange = useMemo(() => {
    if (dataPoints.length === 0) return { min: 100, max: 1000 };
    const params = dataPoints.map((d) => d.params);
    return {
      min: Math.min(...params),
      max: Math.max(...params),
    };
  }, [dataPoints]);

  // Point size range (increased for more variability)
  const sizeRange = { min: 50, max: 1200 };

  // Build X-axis label from selected robustness benchmarks
  const xAxisLabel = useMemo(() => {
    const selectedLabels = ALL_ROBUSTNESS_BENCHMARKS
      .filter((b) => selectedRobustness.has(b.id))
      .map((b) => b.label);
    if (selectedLabels.length === 0) return "Average normalized robustness";
    return `Average normalized robustness (${selectedLabels.join(", ")})`;
  }, [selectedRobustness]);

  // Build Y-axis label from selected benchmarks
  const yAxisLabel = useMemo(() => {
    const count = selectedBenchmarks.size;
    if (count === 0) return "Avg. norm. performance";
    if (count <= 2) {
      const selectedLabels = ALL_PERFORMANCE_BENCHMARKS
        .filter((b) => selectedBenchmarks.has(b.id))
        .map((b) => b.label);
      return `Avg. norm. performance (${selectedLabels.join(", ")})`;
    }
    return `Avg. norm. performance (${count} benchmarks)`;
  }, [selectedBenchmarks]);

  // Check if selections are valid
  const hasValidSelections = selectedBenchmarks.size > 0 && selectedRobustness.size > 0;

  return (
    <div>
      {/* Benchmark selection dropdowns */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Robustness:
          </span>
          <MultiSelectDropdown
            label="Robustness"
            options={ALL_ROBUSTNESS_BENCHMARKS}
            selectedIds={selectedRobustness}
            onToggle={toggleRobustness}
            onSelectAll={() =>
              setSelectedRobustness(
                new Set(ALL_ROBUSTNESS_BENCHMARKS.map((b) => b.id))
              )
            }
            onClearAll={() => setSelectedRobustness(new Set())}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Performance:
          </span>
          <MultiSelectDropdown
            label="Performance"
            options={ALL_PERFORMANCE_BENCHMARKS}
            selectedIds={selectedBenchmarks}
            onToggle={toggleBenchmark}
            onSelectAll={() =>
              setSelectedBenchmarks(
                new Set(ALL_PERFORMANCE_BENCHMARKS.map((b) => b.id))
              )
            }
            onClearAll={() => setSelectedBenchmarks(new Set())}
            size="sm"
          />
        </div>
      </div>

      {!hasValidSelections ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          Please select at least one robustness and one performance benchmark.
        </div>
      ) : dataPoints.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No models with data for all selected benchmarks.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="robustness"
                name="Robustness"
                domain={[(dataMin: number) => dataMin - (dataMin * 0.02), (dataMax: number) => dataMax + (dataMax * 0.02)]}
                label={{
                  value: xAxisLabel,
                  position: "bottom",
                  offset: 40,
                }}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <YAxis
                type="number"
                dataKey="performance"
                name="Performance"
                domain={[(dataMin: number) => dataMin - (dataMin * 0.05), (dataMax: number) => dataMax + (dataMax * 0.05)]}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "center",
                  dx: -30,
                }}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <ZAxis
                type="number"
                dataKey="params"
                range={[sizeRange.min, sizeRange.max]}
                domain={[paramRange.min, paramRange.max]}
                name="Parameters"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Models"
                data={dataPoints}
                fillOpacity={0.7}
              >
                {dataPoints.map((entry, index) => (
                  <Cell
                    key={entry.modelId}
                    fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="modelName"
                  position="top"
                  offset={10}
                  style={{ fontSize: 10, fill: "#374151" }}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <SizeLegend
            minParams={paramRange.min}
            maxParams={paramRange.max}
            minSize={sizeRange.min}
            maxSize={sizeRange.max}
          />
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {dataPoints.length} models with data for all selected benchmarks.
          </p>
        </>
      )}
    </div>
  );
}
