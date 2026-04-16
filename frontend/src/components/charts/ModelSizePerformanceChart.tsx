"use client";

/**
 * Model Size vs Performance scatter chart.
 *
 * X-axis: model parameter count (in millions).
 * Y-axis: average normalized performance across selected benchmarks.
 * Includes a linear regression trend line and R² annotation.
 *
 * @module components/charts/ModelSizePerformanceChart
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  buildSizePerformanceData,
  ALL_BENCHMARKS,
  DEFAULT_SIZE_PERF_BENCHMARKS,
} from "@/lib/scalingLaws";
import { computeLinearRegression } from "@/lib/regression";
import {
  computePaddedDomains,
  enrichDataWithLabels,
  buildScatterLayer,
  buildTextLabelLayers,
  buildRegressionLayer,
  buildChartSpec,
} from "@/lib/vegaSpecBuilder";
import { useSetToggle, useBenchmarkAxisLabel } from "@/hooks";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { VegaChart } from "@/components/charts/VegaChart";
import type { Model, Task, Result } from "@/types";

interface ModelSizePerformanceChartProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
}

const PARAMS_LABEL_EXPR =
  "datum.value >= 1000 ? format(datum.value / 1000, '.1f') + 'B' : format(datum.value, '.0f') + 'M'";

export function ModelSizePerformanceChart({
  models,
  tasks,
  results,
}: ModelSizePerformanceChartProps) {
  // -- State --
  const bench = useSetToggle(
    ALL_BENCHMARKS.map((b) => b.id),
    { initialSelection: Array.from(DEFAULT_SIZE_PERF_BENCHMARKS) },
  );
  const [excludedModelIds, setExcludedModelIds] = useState<Set<string>>(new Set());

  // -- Derived labels --
  const yAxisLabel = useBenchmarkAxisLabel(
    ALL_BENCHMARKS,
    bench.selected,
    "Avg. norm. performance",
  );

  // -- Data --
  const allDataPoints = useMemo(
    () => buildSizePerformanceData(models, tasks, results, bench.selected),
    [models, tasks, results, bench.selected],
  );
  // Reset exclusions whenever the set of available models changes (e.g. benchmark switch)
  const availableModelKey = useMemo(
    () => allDataPoints.map((d) => d.modelId).sort().join(","),
    [allDataPoints],
  );
  useEffect(() => { setExcludedModelIds(new Set()); }, [availableModelKey]);

  const availableModelOptions = useMemo(
    () => allDataPoints.map((d) => ({ id: d.modelId, label: d.modelName })),
    [allDataPoints],
  );
  const selectedModelIds = useMemo(
    () => new Set(allDataPoints.map((d) => d.modelId).filter((id) => !excludedModelIds.has(id))),
    [allDataPoints, excludedModelIds],
  );
  const toggleModel = useCallback((id: string) => {
    setExcludedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const selectAllModels = useCallback(() => setExcludedModelIds(new Set()), []);
  const clearAllModels = useCallback(
    () => setExcludedModelIds(new Set(allDataPoints.map((d) => d.modelId))),
    [allDataPoints],
  );

  const dataPoints = useMemo(
    () => allDataPoints.filter((d) => !excludedModelIds.has(d.modelId)),
    [allDataPoints, excludedModelIds],
  );

  const regression = useMemo(() => {
    if (dataPoints.length < 2) return null;
    return computeLinearRegression(
      dataPoints.map((d) => ({ x: d.params, y: d.performance })),
    );
  }, [dataPoints]);

  // -- Domains --
  const { xDomain, yDomain } = useMemo(
    () =>
      computePaddedDomains(
        dataPoints.map((d) => d.params),
        dataPoints.map((d) => d.performance),
        { xPadMin: 50, xFloor: 0, defaultXDomain: [0, 2000] },
      ),
    [dataPoints],
  );

  // -- Vega-Lite spec --
  const spec = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const labeled = enrichDataWithLabels(
      dataPoints,
      (d) => d.params,
      (d) => d.performance,
      xDomain,
      yDomain,
    );

    const scatter = buildScatterLayer({
      xField: "params",
      yField: "performance",
      xAxisTitle: "Model size (parameters in millions)",
      yAxisTitle: yAxisLabel,
      xDomain,
      yDomain,
      xAxisLabelExpr: PARAMS_LABEL_EXPR,
      yAxisFormat: ".2f",
      fixedSize: 150,
      tooltipFields: [
        { field: "modelName", type: "nominal", title: "Model" },
        { field: "organization", type: "nominal", title: "Organization" },
        { field: "paramsLabel", type: "nominal", title: "Params" },
        { field: "performance", type: "quantitative", title: "Performance", format: ".3f" },
        { field: "benchmarkCount", type: "quantitative", title: "Benchmarks" },
      ],
    });

    return buildChartSpec(labeled, [
      scatter,
      buildRegressionLayer("params", "performance"),
      ...buildTextLabelLayers("params", "performance"),
    ]);
  }, [dataPoints, yAxisLabel, xDomain, yDomain]);

  // -- Render --
  const hasValidSelection = bench.selected.size > 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Benchmarks:</span>
          <MultiSelectDropdown
            label="Benchmarks"
            options={ALL_BENCHMARKS}
            selectedIds={bench.selected}
            onToggle={bench.toggle}
            onSelectAll={bench.selectAll}
            onClearAll={bench.clearAll}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Models:</span>
          <MultiSelectDropdown
            label="Models"
            options={availableModelOptions}
            selectedIds={selectedModelIds}
            onToggle={toggleModel}
            onSelectAll={selectAllModels}
            onClearAll={clearAllModels}
            size="sm"
          />
        </div>
      </div>

      {!hasValidSelection ? (
        <div className="flex h-[500px] items-center justify-center text-muted-foreground">
          Please select at least one benchmark.
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
          {regression && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Linear regression: R² = {regression.r2.toFixed(3)}
            </p>
          )}
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {dataPoints.length} models with data for all selected benchmarks.
          </p>
        </>
      ) : null}
    </div>
  );
}
