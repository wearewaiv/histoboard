"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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

// Label collision avoidance utilities
const CHAR_WIDTH = 6.5; // approximate width per character at font-size 11
const TEXT_HEIGHT = 13; // approximate height at font-size 11
const LABEL_PADDING = 6; // minimum gap between circle edge and label
const LABEL_MARGIN = 4; // minimum gap between labels (added to bounding boxes)
const CIRCLE_MARGIN = 2; // minimum gap between labels and circles (added to circle radius)
const PREFERRED_ANGLE = -Math.PI / 12; // Slight top-right direction (-15 degrees)

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

// Check if a rectangle overlaps with a circle
function rectCircleCollision(
  rectX: number, rectY: number, rectW: number, rectH: number,
  circleX: number, circleY: number, circleR: number
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy < circleR * circleR;
}

// Check if two rectangles overlap
function rectsOverlap(
  r1x: number, r1y: number, r1w: number, r1h: number,
  r2x: number, r2y: number, r2w: number, r2h: number
): boolean {
  return !(r1x + r1w < r2x || r2x + r2w < r1x || r1y + r1h < r2y || r2y + r2h < r1y);
}

// Get label bounding box given position and text anchor
function getLabelBounds(
  x: number, y: number, width: number, height: number, textAnchor: "start" | "middle" | "end"
): { x: number; y: number; w: number; h: number } {
  let boxX = x;
  if (textAnchor === "middle") {
    boxX = x - width / 2;
  } else if (textAnchor === "end") {
    boxX = x - width;
  }
  // Text y is baseline, so box starts above
  const boxY = y - height * 0.75;
  return { x: boxX, y: boxY, w: width, h: height };
}

// Compute collision-free label positions
function computeCollisionFreePositions(points: CollectedPoint[]): Map<number, ComputedLabel> {
  const result = new Map<number, ComputedLabel>();
  const placedLabels: { index: number; bounds: { x: number; y: number; w: number; h: number } }[] = [];

  // Try angles from 0 to 2π in small increments
  const angleSteps = 24; // Try 24 different angles (every 15 degrees)
  const angles = Array.from({ length: angleSteps }, (_, i) => (i * 2 * Math.PI) / angleSteps);

  // Sort points to process them in a consistent order (e.g., by x position)
  const sortedPoints = [...points].sort((a, b) => a.cx - b.cx || a.cy - b.cy);

  // Helper to check all collisions and return a penalty score (0 = no collision)
  const getCollisionPenalty = (
    bounds: { x: number; y: number; w: number; h: number },
    excludeOwnCircle: CollectedPoint
  ): number => {
    let penalty = 0;

    // Check collision with all circles (with margin)
    for (const otherPoint of points) {
      if (rectCircleCollision(
        bounds.x, bounds.y, bounds.w, bounds.h,
        otherPoint.cx, otherPoint.cy, otherPoint.radius + CIRCLE_MARGIN
      )) {
        // Higher penalty for own circle collision
        penalty += otherPoint.index === excludeOwnCircle.index ? 1000 : 100;
      }
    }

    // Check collision with already placed labels (with margin)
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

    // Try each angle
    for (const angle of angles) {
      // Distance from circle center to label anchor point
      const distance = point.radius + LABEL_PADDING;

      // Compute label anchor position
      const labelX = point.cx + Math.cos(angle) * distance;
      const labelY = point.cy + Math.sin(angle) * distance;

      // Determine text anchor based on angle
      let textAnchor: "start" | "middle" | "end";
      if (angle > Math.PI * 0.75 && angle < Math.PI * 1.25) {
        textAnchor = "end"; // Left side
      } else if (angle >= Math.PI * 0.25 && angle <= Math.PI * 0.75) {
        textAnchor = "middle"; // Bottom
      } else if (angle >= Math.PI * 1.25 && angle <= Math.PI * 1.75) {
        textAnchor = "middle"; // Top
      } else {
        textAnchor = "start"; // Right side
      }

      // Get bounding box for this position
      const bounds = getLabelBounds(labelX, labelY, textWidth, textHeight, textAnchor);

      // Calculate collision penalty
      const penalty = getCollisionPenalty(bounds, point);

      // Score based on distance from preferred position (top-right direction)
      const angleDiff = Math.abs(angle - PREFERRED_ANGLE);
      const angleScore = Math.min(angleDiff, 2 * Math.PI - angleDiff);

      // Combined score: prioritize no collisions, then prefer good angle
      // If penalty is 0, use angle score; otherwise penalty dominates
      const totalScore = penalty * 1000 + angleScore;

      if (totalScore < bestScore || (penalty < bestPenalty)) {
        if (penalty < bestPenalty || (penalty === bestPenalty && totalScore < bestScore)) {
          bestScore = totalScore;
          bestPenalty = penalty;
          bestPosition = { x: labelX, y: labelY, textAnchor };
        }
      }
    }

    // If still no position found (shouldn't happen), use default
    if (!bestPosition) {
      const distance = point.radius + LABEL_PADDING;
      bestPosition = {
        x: point.cx + Math.cos(PREFERRED_ANGLE) * distance,
        y: point.cy + Math.sin(PREFERRED_ANGLE) * distance,
        textAnchor: "start",
      };
    }

    // Store result and mark as placed
    result.set(point.index, bestPosition);
    const finalBounds = getLabelBounds(bestPosition.x, bestPosition.y, textWidth, textHeight, bestPosition.textAnchor);
    placedLabels.push({ index: point.index, bounds: finalBounds });
  }

  return result;
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

  // Track data changes to reset label collection
  useEffect(() => {
    const newKey = dataPoints.map(d => d.modelId).join(",");
    if (newKey !== dataPointsKeyRef.current) {
      dataPointsKeyRef.current = newKey;
      resetLabelCollection();
    }
  }, [dataPoints, resetLabelCollection]);

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

  // Helper to compute point radius
  const getPointRadius = (params: number) => {
    const normalizedParam = (params - paramRange.min) / (paramRange.max - paramRange.min || 1);
    const pointSize = sizeRange.min + normalizedParam * (sizeRange.max - sizeRange.min);
    return Math.sqrt(pointSize) / 2;
  };

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

  // Compute axis domains and ticks with regular intervals
  const { xDomain, xTicks, yDomain, yTicks } = useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        xDomain: [0, 1] as [number, number],
        xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
        yDomain: [0, 1] as [number, number],
        yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      };
    }

    const xValues = dataPoints.map((d) => d.robustness);
    const yValues = dataPoints.map((d) => d.performance);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Round to nice 0.05 intervals with padding
    const xStart = Math.floor(xMin * 20 - 1) / 20; // Round down to 0.05, with padding
    const xEnd = Math.ceil(xMax * 20 + 1) / 20;   // Round up to 0.05, with padding
    const yStart = Math.floor(yMin * 20 - 1) / 20;
    const yEnd = Math.ceil(yMax * 20 + 1) / 20;

    // Generate ticks at 0.05 intervals
    const generateTicks = (start: number, end: number, step: number = 0.05) => {
      const ticks: number[] = [];
      for (let v = start; v <= end + step / 2; v += step) {
        ticks.push(Math.round(v * 100) / 100); // Avoid floating point issues
      }
      return ticks;
    };

    return {
      xDomain: [xStart, xEnd] as [number, number],
      xTicks: generateTicks(xStart, xEnd),
      yDomain: [yStart, yEnd] as [number, number],
      yTicks: generateTicks(yStart, yEnd),
    };
  }, [dataPoints]);

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
            <ScatterChart margin={{ top: 50, right: 80, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="robustness"
                name="Robustness"
                domain={xDomain}
                ticks={xTicks}
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
                range={[sizeRange.min, sizeRange.max]}
                domain={[paramRange.min, paramRange.max]}
                name="Parameters"
              />
              <Tooltip content={<CustomTooltip />} />
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
                    const radius = getPointRadius(dataPoints[idx]?.params ?? 100);

                    // Collecting phase: gather all positions
                    if (isCollectingRef.current) {
                      // Check if this point is already collected
                      const alreadyCollected = collectedPointsRef.current.some(p => p.index === idx);
                      if (!alreadyCollected) {
                        collectedPointsRef.current.push({
                          index: idx,
                          cx: xPos,
                          cy: yPos,
                          radius,
                          name: value as string,
                        });

                        // When all points are collected, compute positions
                        if (collectedPointsRef.current.length === dataPoints.length) {
                          isCollectingRef.current = false;
                          const computed = computeCollisionFreePositions(collectedPointsRef.current);
                          // Use setTimeout to avoid setState during render
                          setTimeout(() => setLabelPositions(computed), 0);
                        }
                      }

                      // Default position during collection (top-right direction)
                      const defaultDistance = radius + LABEL_PADDING;
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

                    // Use computed collision-free position
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

                    // Fallback to default position (top-right direction)
                    const fallbackDistance = radius + LABEL_PADDING;
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
