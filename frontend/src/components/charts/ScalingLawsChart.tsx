"use client";

/**
 * Scaling Laws bubble chart: Robustness vs Performance.
 *
 * X-axis: average normalized robustness across selected robustness benchmarks.
 * Y-axis: average normalized performance across selected performance benchmarks.
 * Bubble size encodes model parameter count.
 *
 * @module components/charts/ScalingLawsChart
 */

import { useMemo } from "react";
import {
  buildScalingLawsData,
  ALL_PERFORMANCE_BENCHMARKS,
  DEFAULT_SELECTED_BENCHMARKS,
  ALL_ROBUSTNESS_BENCHMARKS,
  DEFAULT_SELECTED_ROBUSTNESS,
} from "@/lib/scalingLaws";
import {
  computePaddedDomains,
  enrichDataWithLabels,
  buildScatterLayer,
  buildTextLabelLayers,
  buildChartSpec,
} from "@/lib/vegaSpecBuilder";
import { useSetToggle, useBenchmarkAxisLabel } from "@/hooks";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { VegaChart } from "@/components/charts/VegaChart";
import type { Model, Task, Result } from "@/types";

interface ScalingLawsChartProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
}

const PARAMS_LEGEND_LABEL_EXPR =
  "datum.value >= 1000 ? format(datum.value / 1000, '.1f') + 'B' : format(datum.value, '.0f') + 'M'";

export function ScalingLawsChart({
  models,
  tasks,
  results,
}: ScalingLawsChartProps) {
  // -- State --
  const perf = useSetToggle(
    ALL_PERFORMANCE_BENCHMARKS.map((b) => b.id),
    { initialSelection: Array.from(DEFAULT_SELECTED_BENCHMARKS) },
  );
  const robust = useSetToggle(
    ALL_ROBUSTNESS_BENCHMARKS.map((b) => b.id),
    { initialSelection: Array.from(DEFAULT_SELECTED_ROBUSTNESS) },
  );

  // -- Derived labels --
  const xAxisLabel = useBenchmarkAxisLabel(
    ALL_ROBUSTNESS_BENCHMARKS,
    robust.selected,
    "Average normalized robustness",
  );
  const yAxisLabel = useBenchmarkAxisLabel(
    ALL_PERFORMANCE_BENCHMARKS,
    perf.selected,
    "Avg. norm. performance",
  );

  // -- Data --
  const dataPoints = useMemo(
    () => buildScalingLawsData(models, tasks, results, perf.selected, robust.selected),
    [models, tasks, results, perf.selected, robust.selected],
  );

  const paramRange = useMemo(() => {
    if (dataPoints.length === 0) return { min: 100, max: 1000 };
    const params = dataPoints.map((d) => d.params);
    return { min: Math.min(...params), max: Math.max(...params) };
  }, [dataPoints]);

  // -- Domains --
  const { xDomain, yDomain } = useMemo(
    () =>
      computePaddedDomains(
        dataPoints.map((d) => d.robustness),
        dataPoints.map((d) => d.performance),
      ),
    [dataPoints],
  );

  // -- Vega-Lite spec --
  const spec = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const labeled = enrichDataWithLabels(
      dataPoints,
      (d) => d.robustness,
      (d) => d.performance,
      xDomain,
      yDomain,
    );

    const scatter = buildScatterLayer({
      xField: "robustness",
      yField: "performance",
      xAxisTitle: xAxisLabel,
      yAxisTitle: yAxisLabel,
      xDomain,
      yDomain,
      xAxisFormat: ".2f",
      yAxisFormat: ".2f",
      sizeEncoding: {
        field: "params",
        domain: [paramRange.min, paramRange.max],
        range: [50, 1200],
        legendTitle: "Model size",
        legendFormat: ".0f",
        legendLabelExpr: PARAMS_LEGEND_LABEL_EXPR,
      },
      tooltipFields: [
        { field: "modelName", type: "nominal", title: "Model" },
        { field: "organization", type: "nominal", title: "Organization" },
        { field: "robustness", type: "quantitative", title: "Robustness", format: ".3f" },
        { field: "performance", type: "quantitative", title: "Performance", format: ".3f" },
        { field: "paramsLabel", type: "nominal", title: "Params" },
      ],
    });

    return buildChartSpec(labeled, [
      scatter,
      ...buildTextLabelLayers("robustness", "performance"),
    ]);
  }, [dataPoints, xAxisLabel, yAxisLabel, paramRange, xDomain, yDomain]);

  // -- Render --
  const hasValidSelections = perf.selected.size > 0 && robust.selected.size > 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Robustness:</span>
          <MultiSelectDropdown
            label="Robustness"
            options={ALL_ROBUSTNESS_BENCHMARKS}
            selectedIds={robust.selected}
            onToggle={robust.toggle}
            onSelectAll={robust.selectAll}
            onClearAll={robust.clearAll}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Performance:</span>
          <MultiSelectDropdown
            label="Performance"
            options={ALL_PERFORMANCE_BENCHMARKS}
            selectedIds={perf.selected}
            onToggle={perf.toggle}
            onSelectAll={perf.selectAll}
            onClearAll={perf.clearAll}
            size="sm"
          />
        </div>
      </div>

      {!hasValidSelections ? (
        <div className="flex h-[500px] items-center justify-center text-muted-foreground">
          Please select at least one robustness and one performance benchmark.
        </div>
      ) : dataPoints.length === 0 ? (
        <div className="flex h-[500px] items-center justify-center text-muted-foreground">
          No models with data for all selected benchmarks.
        </div>
      ) : spec ? (
        <>
          <VegaChart spec={spec} className="w-full" />
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Scroll to zoom, drag to pan. Double-click to reset.
          </p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {dataPoints.length} models with data for all selected benchmarks.
          </p>
        </>
      ) : null}
    </div>
  );
}
