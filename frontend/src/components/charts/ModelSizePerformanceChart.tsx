"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Line,
  ComposedChart,
} from "recharts";
import {
  buildSizePerformanceData,
  ALL_BENCHMARKS,
  DEFAULT_SIZE_PERF_BENCHMARKS,
  type SizePerformanceDataPoint,
} from "@/lib/scalingLaws";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import type { Model, Task, Result } from "@/types";

interface ModelSizePerformanceChartProps {
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

// Linear regression computation
function computeLinearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } | null {
  if (points.length < 2) return null;

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Compute R² (coefficient of determination)
  const meanY = sumY / n;
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssResidual = points.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
}

// Generate regression line points
function generateRegressionLineData(
  regression: { slope: number; intercept: number },
  xMin: number,
  xMax: number,
  numPoints: number = 50
): { params: number; regression: number }[] {
  const step = (xMax - xMin) / (numPoints - 1);
  const points: { params: number; regression: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = regression.slope * x + regression.intercept;
    points.push({ params: x, regression: y });
  }

  return points;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SizePerformanceDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-white p-3 shadow-lg">
      <p className="font-semibold">{data.modelName}</p>
      <p className="text-sm text-muted-foreground">{data.organization}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Params:</span>{" "}
          {formatParams(data.params)}
        </p>
        <p>
          <span className="text-muted-foreground">Performance:</span>{" "}
          {data.performance.toFixed(3)}
        </p>
        <p>
          <span className="text-muted-foreground">Benchmarks:</span>{" "}
          {data.benchmarkCount}
        </p>
      </div>
    </div>
  );
}

// Label collision avoidance utilities
const CHAR_WIDTH = 6.5;
const TEXT_HEIGHT = 13;
const LABEL_PADDING = 6;
const LABEL_MARGIN = 4;
const CIRCLE_MARGIN = 2;
const PREFERRED_ANGLE = -Math.PI / 12;

interface CollectedPoint {
  index: number;
  cx: number;
  cy: number;
  radius: number;
  name: string;
}

interface ComputedLabel {
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
}

function estimateTextWidth(text: string): number {
  return text.length * CHAR_WIDTH;
}

function rectCircleCollision(
  rectX: number, rectY: number, rectW: number, rectH: number,
  circleX: number, circleY: number, circleR: number
): boolean {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy < circleR * circleR;
}

function rectsOverlap(
  r1x: number, r1y: number, r1w: number, r1h: number,
  r2x: number, r2y: number, r2w: number, r2h: number
): boolean {
  return !(r1x + r1w < r2x || r2x + r2w < r1x || r1y + r1h < r2y || r2y + r2h < r1y);
}

function getLabelBounds(
  x: number, y: number, width: number, height: number, textAnchor: "start" | "middle" | "end"
): { x: number; y: number; w: number; h: number } {
  let boxX = x;
  if (textAnchor === "middle") {
    boxX = x - width / 2;
  } else if (textAnchor === "end") {
    boxX = x - width;
  }
  const boxY = y - height * 0.75;
  return { x: boxX, y: boxY, w: width, h: height };
}

function computeCollisionFreePositions(points: CollectedPoint[]): Map<number, ComputedLabel> {
  const result = new Map<number, ComputedLabel>();
  const placedLabels: { index: number; bounds: { x: number; y: number; w: number; h: number } }[] = [];

  const angleSteps = 24;
  const angles = Array.from({ length: angleSteps }, (_, i) => (i * 2 * Math.PI) / angleSteps);

  const sortedPoints = [...points].sort((a, b) => a.cx - b.cx || a.cy - b.cy);

  const getCollisionPenalty = (
    bounds: { x: number; y: number; w: number; h: number },
    excludeOwnCircle: CollectedPoint
  ): number => {
    let penalty = 0;

    for (const otherPoint of points) {
      if (rectCircleCollision(
        bounds.x, bounds.y, bounds.w, bounds.h,
        otherPoint.cx, otherPoint.cy, otherPoint.radius + CIRCLE_MARGIN
      )) {
        penalty += otherPoint.index === excludeOwnCircle.index ? 1000 : 100;
      }
    }

    for (const placed of placedLabels) {
      if (rectsOverlap(
        bounds.x - LABEL_MARGIN, bounds.y - LABEL_MARGIN,
        bounds.w + 2 * LABEL_MARGIN, bounds.h + 2 * LABEL_MARGIN,
        placed.bounds.x - LABEL_MARGIN, placed.bounds.y - LABEL_MARGIN,
        placed.bounds.w + 2 * LABEL_MARGIN, placed.bounds.h + 2 * LABEL_MARGIN
      )) {
        penalty += 50;
      }
    }

    return penalty;
  };

  for (const point of sortedPoints) {
    const textWidth = estimateTextWidth(point.name);
    const textHeight = TEXT_HEIGHT;

    let bestPosition: ComputedLabel | null = null;
    let bestScore = Infinity;
    let bestPenalty = Infinity;

    for (const angle of angles) {
      const distance = point.radius + LABEL_PADDING;
      const labelX = point.cx + Math.cos(angle) * distance;
      const labelY = point.cy + Math.sin(angle) * distance;

      let textAnchor: "start" | "middle" | "end";
      if (angle > Math.PI * 0.75 && angle < Math.PI * 1.25) {
        textAnchor = "end";
      } else if (angle >= Math.PI * 0.25 && angle <= Math.PI * 0.75) {
        textAnchor = "middle";
      } else if (angle >= Math.PI * 1.25 && angle <= Math.PI * 1.75) {
        textAnchor = "middle";
      } else {
        textAnchor = "start";
      }

      const bounds = getLabelBounds(labelX, labelY, textWidth, textHeight, textAnchor);
      const penalty = getCollisionPenalty(bounds, point);
      const angleDiff = Math.abs(angle - PREFERRED_ANGLE);
      const angleScore = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      const totalScore = penalty * 1000 + angleScore;

      if (totalScore < bestScore || (penalty < bestPenalty)) {
        if (penalty < bestPenalty || (penalty === bestPenalty && totalScore < bestScore)) {
          bestScore = totalScore;
          bestPenalty = penalty;
          bestPosition = { x: labelX, y: labelY, textAnchor };
        }
      }
    }

    if (!bestPosition) {
      const distance = point.radius + LABEL_PADDING;
      bestPosition = {
        x: point.cx + Math.cos(PREFERRED_ANGLE) * distance,
        y: point.cy + Math.sin(PREFERRED_ANGLE) * distance,
        textAnchor: "start",
      };
    }

    result.set(point.index, bestPosition);
    const finalBounds = getLabelBounds(bestPosition.x, bestPosition.y, textWidth, textHeight, bestPosition.textAnchor);
    placedLabels.push({ index: point.index, bounds: finalBounds });
  }

  return result;
}

export function ModelSizePerformanceChart({
  models,
  tasks,
  results,
}: ModelSizePerformanceChartProps) {
  // Selected benchmarks state
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<Set<string>>(
    () => new Set(DEFAULT_SIZE_PERF_BENCHMARKS)
  );

  // Label collision avoidance state
  const [labelPositions, setLabelPositions] = useState<Map<number, ComputedLabel>>(new Map());
  const collectedPointsRef = useRef<CollectedPoint[]>([]);
  const isCollectingRef = useRef(true);
  const dataPointsKeyRef = useRef<string>("");

  // Reset label collection when data changes
  const resetLabelCollection = useCallback(() => {
    isCollectingRef.current = true;
    collectedPointsRef.current = [];
    setLabelPositions(new Map());
  }, []);

  // Toggle benchmark selection
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

  // Build data points
  const dataPoints = useMemo(
    () => buildSizePerformanceData(models, tasks, results, selectedBenchmarks),
    [models, tasks, results, selectedBenchmarks]
  );

  // Track data changes to reset label collection
  useEffect(() => {
    const newKey = dataPoints.map(d => d.modelId).join(",");
    if (newKey !== dataPointsKeyRef.current) {
      dataPointsKeyRef.current = newKey;
      resetLabelCollection();
    }
  }, [dataPoints, resetLabelCollection]);

  // Fixed point size for all models
  const pointSize = 150;
  const pointRadius = Math.sqrt(pointSize) / 2;

  // Build Y-axis label from selected benchmarks
  const yAxisLabel = useMemo(() => {
    const count = selectedBenchmarks.size;
    if (count === 0) return "Avg. norm. performance";
    if (count <= 2) {
      const selectedLabels = ALL_BENCHMARKS
        .filter((b) => selectedBenchmarks.has(b.id))
        .map((b) => b.label);
      return `Avg. norm. performance (${selectedLabels.join(", ")})`;
    }
    return `Avg. norm. performance (${count} benchmarks)`;
  }, [selectedBenchmarks]);

  // Check if selection is valid
  const hasValidSelection = selectedBenchmarks.size > 0;

  // Compute linear regression
  const regression = useMemo(() => {
    if (dataPoints.length < 2) return null;
    const points = dataPoints.map((d) => ({ x: d.params, y: d.performance }));
    return computeLinearRegression(points);
  }, [dataPoints]);

  // Compute axis domains and ticks
  const { xDomain, xTicks, yDomain, yTicks } = useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        xDomain: [0, 2000] as [number, number],
        xTicks: [0, 500, 1000, 1500, 2000],
        yDomain: [0, 1] as [number, number],
        yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      };
    }

    const xValues = dataPoints.map((d) => d.params);
    const yValues = dataPoints.map((d) => d.performance);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // X-axis: round to nice values with padding
    const xStart = Math.max(0, Math.floor(xMin / 100) * 100 - 100);
    const xEnd = Math.ceil(xMax / 100) * 100 + 100;

    // Y-axis: round to nice 0.05 intervals with padding
    const yStart = Math.floor(yMin * 20 - 1) / 20;
    const yEnd = Math.ceil(yMax * 20 + 1) / 20;

    // Generate X ticks
    const generateXTicks = (start: number, end: number) => {
      const range = end - start;
      let step = 100;
      if (range > 2000) step = 500;
      if (range > 5000) step = 1000;

      const ticks: number[] = [];
      for (let v = start; v <= end; v += step) {
        ticks.push(v);
      }
      return ticks;
    };

    // Generate Y ticks at 0.05 intervals
    const generateYTicks = (start: number, end: number, step: number = 0.05) => {
      const ticks: number[] = [];
      for (let v = start; v <= end + step / 2; v += step) {
        ticks.push(Math.round(v * 100) / 100);
      }
      return ticks;
    };

    return {
      xDomain: [xStart, xEnd] as [number, number],
      xTicks: generateXTicks(xStart, xEnd),
      yDomain: [yStart, yEnd] as [number, number],
      yTicks: generateYTicks(yStart, yEnd),
    };
  }, [dataPoints]);

  // Generate regression line data
  const regressionLineData = useMemo(() => {
    if (!regression || dataPoints.length < 2) return [];
    return generateRegressionLineData(regression, xDomain[0], xDomain[1]);
  }, [regression, xDomain, dataPoints.length]);

  return (
    <div>
      {/* Benchmark selection dropdown */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Benchmarks:
          </span>
          <MultiSelectDropdown
            label="Benchmarks"
            options={ALL_BENCHMARKS}
            selectedIds={selectedBenchmarks}
            onToggle={toggleBenchmark}
            onSelectAll={() =>
              setSelectedBenchmarks(new Set(ALL_BENCHMARKS.map((b) => b.id)))
            }
            onClearAll={() => setSelectedBenchmarks(new Set())}
            size="sm"
          />
        </div>
      </div>

      {!hasValidSelection ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          Please select at least one benchmark.
        </div>
      ) : dataPoints.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No models with data for all selected benchmarks.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart margin={{ top: 50, right: 80, bottom: 60, left: 60 }} data={regressionLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="params"
                name="Model Size"
                domain={xDomain}
                ticks={xTicks}
                scale="linear"
                label={{
                  value: "Model size (parameters in millions)",
                  position: "bottom",
                  offset: 40,
                }}
                tickFormatter={(v) => formatParams(v)}
              />
              <YAxis
                type="number"
                dataKey="performance"
                name="Performance"
                domain={yDomain}
                ticks={yTicks}
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
                range={[pointSize, pointSize]}
                name="Parameters"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Linear regression line */}
              {regressionLineData.length > 0 && (
                <Line
                  type="linear"
                  dataKey="regression"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
              )}
              <Scatter
                name="Models"
                data={dataPoints}
                fillOpacity={0.8}
              >
                {dataPoints.map((entry, index) => (
                  <Cell
                    key={entry.modelId}
                    fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                    stroke="#000000"
                    strokeWidth={1}
                  />
                ))}
                <LabelList
                  dataKey="modelName"
                  content={(props) => {
                    const { x, y, value, index } = props;
                    if (x === undefined || y === undefined || !value || index === undefined) return null;
                    const xPos = x as number;
                    const yPos = y as number;
                    const idx = index as number;

                    // Collecting phase: gather all positions
                    if (isCollectingRef.current) {
                      const alreadyCollected = collectedPointsRef.current.some(p => p.index === idx);
                      if (!alreadyCollected) {
                        collectedPointsRef.current.push({
                          index: idx,
                          cx: xPos,
                          cy: yPos,
                          radius: pointRadius,
                          name: value as string,
                        });

                        if (collectedPointsRef.current.length === dataPoints.length) {
                          isCollectingRef.current = false;
                          const computed = computeCollisionFreePositions(collectedPointsRef.current);
                          setTimeout(() => setLabelPositions(computed), 0);
                        }
                      }

                      const defaultDistance = pointRadius + LABEL_PADDING;
                      return (
                        <text
                          x={xPos + Math.cos(PREFERRED_ANGLE) * defaultDistance}
                          y={yPos + Math.sin(PREFERRED_ANGLE) * defaultDistance}
                          textAnchor="start"
                          style={{ fontSize: 11, fill: "#1f2937", fontWeight: 600 }}
                        >
                          {value}
                        </text>
                      );
                    }

                    const computed = labelPositions.get(idx);
                    if (computed) {
                      return (
                        <text
                          x={computed.x}
                          y={computed.y}
                          textAnchor={computed.textAnchor}
                          style={{ fontSize: 11, fill: "#1f2937", fontWeight: 600 }}
                        >
                          {value}
                        </text>
                      );
                    }

                    const fallbackDistance = pointRadius + LABEL_PADDING;
                    return (
                      <text
                        x={xPos + Math.cos(PREFERRED_ANGLE) * fallbackDistance}
                        y={yPos + Math.sin(PREFERRED_ANGLE) * fallbackDistance}
                        textAnchor="start"
                        style={{ fontSize: 11, fill: "#1f2937", fontWeight: 600 }}
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
          {regression && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Linear regression: R² = {regression.r2.toFixed(3)}
            </p>
          )}
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {dataPoints.length} models with data for all selected benchmarks.
          </p>
        </>
      )}
    </div>
  );
}
