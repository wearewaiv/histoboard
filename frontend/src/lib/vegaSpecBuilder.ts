/**
 * Shared Vega-Lite specification building utilities for scatter chart components.
 *
 * These functions produce plain JSON objects (Vega-Lite spec fragments).
 * They contain zero React code and are fully testable in isolation.
 *
 * @see {@link module:lib/chartColors} for color palette and label placement
 * @module lib/vegaSpecBuilder
 */

import {
  getModelColor,
  formatParams,
  computeLabelPlacements,
  LABEL_DIR_STYLE,
  type LabelDir,
} from "./chartColors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type Spec = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface TooltipField {
  field: string;
  type: "nominal" | "quantitative";
  title: string;
  format?: string;
}

export interface SizeEncoding {
  field: string;
  domain: [number, number];
  range: [number, number];
  legendTitle: string;
  legendFormat?: string;
  legendLabelExpr?: string;
}

export interface ScatterLayerOptions {
  xField: string;
  yField: string;
  xAxisTitle: string;
  yAxisTitle: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xAxisFormat?: string;
  xAxisLabelExpr?: string;
  yAxisFormat?: string;
  /** Bubble-size encoding. Omit for fixed-size points. */
  sizeEncoding?: SizeEncoding;
  /** Fixed point size (ignored when sizeEncoding is provided). Defaults to 150. */
  fixedSize?: number;
  tooltipFields: TooltipField[];
}

export interface PaddedDomainOptions {
  xPadFraction?: number; // default 0.1
  yPadFraction?: number; // default 0.1
  xPadMin?: number; // default 0.02
  yPadMin?: number; // default 0.02
  /** Optional lower bound for xMin (e.g. 0 to prevent negative). */
  xFloor?: number;
  /** Fallback when xValues is empty. */
  defaultXDomain?: [number, number];
  /** Fallback when yValues is empty. */
  defaultYDomain?: [number, number];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base Vega-Lite config shared by all charts. */
export const BASE_VEGA_CONFIG: Spec = {
  background: "transparent",
  font: "system-ui, -apple-system, sans-serif",
  view: { stroke: null },
};

// ---------------------------------------------------------------------------
// Spec shell
// ---------------------------------------------------------------------------

/** Base spec skeleton: $schema, responsive width, fixed height, padding. */
export function baseSpecShell(): Spec {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 480,
    autosize: { type: "fit", contains: "padding" },
    padding: { top: 20, right: 20, bottom: 50, left: 20 },
    config: BASE_VEGA_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

/**
 * Compute padded axis domains with configurable padding and floor values.
 *
 * Each axis gets symmetric padding equal to `padFraction * range`, clamped to
 * a minimum of `padMin`. An optional `xFloor` prevents xMin from going below
 * a given value (useful for parameter counts that can't be negative).
 */
export function computePaddedDomains(
  xValues: number[],
  yValues: number[],
  options: PaddedDomainOptions = {},
): { xDomain: [number, number]; yDomain: [number, number] } {
  const {
    xPadFraction = 0.1,
    yPadFraction = 0.1,
    xPadMin = 0.02,
    yPadMin = 0.02,
    xFloor,
    defaultXDomain = [0, 1],
    defaultYDomain = [0, 1],
  } = options;

  if (xValues.length === 0 || yValues.length === 0) {
    return { xDomain: defaultXDomain, yDomain: defaultYDomain };
  }

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xPad = Math.max((xMax - xMin) * xPadFraction, xPadMin);
  const yPad = Math.max((yMax - yMin) * yPadFraction, yPadMin);

  return {
    xDomain: [
      xFloor !== undefined ? Math.max(xFloor, xMin - xPad) : xMin - xPad,
      xMax + xPad,
    ],
    yDomain: [yMin - yPad, yMax + yPad],
  };
}

// ---------------------------------------------------------------------------
// Data enrichment
// ---------------------------------------------------------------------------

/**
 * Enrich raw data points with color, formatted params label, and label
 * placement direction for scatter-plot rendering.
 */
export function enrichDataWithLabels<
  T extends { params: number; modelName: string },
>(
  dataPoints: T[],
  xAccessor: (d: T) => number,
  yAccessor: (d: T) => number,
  xDomain: [number, number],
  yDomain: [number, number],
): Array<T & { color: string; paramsLabel: string; labelDir: LabelDir }> {
  const colored = dataPoints.map((d, i) => ({
    ...d,
    color: getModelColor(i),
    paramsLabel: formatParams(d.params),
  }));

  const directions = computeLabelPlacements(
    colored.map((d) => ({
      x: xAccessor(d),
      y: yAccessor(d),
      label: d.modelName,
    })),
    xDomain,
    yDomain,
  );

  return colored.map((d, i) => ({ ...d, labelDir: directions[i] }));
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

/**
 * Build the primary scatter-point layer with zoom/pan interaction.
 *
 * Supports both fixed-size dots and variable-size bubbles via the
 * `sizeEncoding` option.
 */
export function buildScatterLayer(options: ScatterLayerOptions): Spec {
  const {
    xField,
    yField,
    xAxisTitle,
    yAxisTitle,
    xDomain,
    yDomain,
    xAxisFormat,
    xAxisLabelExpr,
    yAxisFormat,
    sizeEncoding,
    fixedSize = 150,
    tooltipFields,
  } = options;

  // Build x-axis config
  const xAxis: Spec = { title: xAxisTitle, grid: true, gridDash: [3, 3] };
  if (xAxisFormat) xAxis.format = xAxisFormat;
  if (xAxisLabelExpr) xAxis.labelExpr = xAxisLabelExpr;

  // Build y-axis config
  const yAxis: Spec = { title: yAxisTitle, grid: true, gridDash: [3, 3] };
  if (yAxisFormat) yAxis.format = yAxisFormat;

  // Build mark
  const mark: Spec = {
    type: "circle",
    opacity: 0.8,
    stroke: "#000000",
    strokeWidth: 1,
  };
  if (!sizeEncoding) mark.size = fixedSize;

  // Build encoding
  const encoding: Spec = {
    x: {
      field: xField,
      type: "quantitative",
      scale: { domain: xDomain },
      axis: xAxis,
    },
    y: {
      field: yField,
      type: "quantitative",
      scale: { domain: yDomain },
      axis: yAxis,
    },
    color: { field: "color", type: "nominal", scale: null, legend: null },
    tooltip: tooltipFields,
  };

  if (sizeEncoding) {
    const legend: Spec = {
      title: sizeEncoding.legendTitle,
    };
    if (sizeEncoding.legendFormat) legend.format = sizeEncoding.legendFormat;
    if (sizeEncoding.legendLabelExpr)
      legend.labelExpr = sizeEncoding.legendLabelExpr;

    encoding.size = {
      field: sizeEncoding.field,
      type: "quantitative",
      scale: {
        domain: sizeEncoding.domain,
        range: sizeEncoding.range,
      },
      legend,
    };
  }

  return {
    params: [
      {
        name: "zoom",
        select: { type: "interval", encodings: ["x", "y"] },
        bind: "scales",
      },
    ],
    mark,
    encoding,
  };
}

/**
 * Build the 4 directional text-label layers for scatter plots.
 *
 * Each layer filters data to one label direction (NE, NW, SE, SW) and applies
 * the matching `dx`, `dy`, and `align` mark properties. This pattern is
 * required because Vega-Lite mark properties cannot vary per datum.
 */
export function buildTextLabelLayers(
  xField: string,
  yField: string,
): Spec[] {
  return (Object.keys(LABEL_DIR_STYLE) as LabelDir[]).map((dir) => {
    const { dx, dy, align } = LABEL_DIR_STYLE[dir];
    return {
      transform: [{ filter: `datum.labelDir === '${dir}'` }],
      mark: {
        type: "text",
        fontSize: 11,
        fontWeight: 600,
        fill: "#1f2937",
        align,
        dx,
        dy,
      },
      encoding: {
        x: { field: xField, type: "quantitative" },
        y: { field: yField, type: "quantitative" },
        text: { field: "modelName", type: "nominal" },
      },
    };
  });
}

/**
 * Build a dashed linear regression line layer.
 */
export function buildRegressionLayer(
  xField: string,
  yField: string,
): Spec {
  return {
    mark: {
      type: "line",
      color: "#6b7280",
      strokeWidth: 2,
      strokeDash: [5, 5],
    },
    transform: [
      { regression: yField, on: xField, method: "linear" },
    ],
    encoding: {
      x: { field: xField, type: "quantitative" },
      y: { field: yField, type: "quantitative" },
    },
  };
}

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

/**
 * Assemble a complete Vega-Lite spec from data and layers.
 *
 * Merges the base spec shell with the provided data values and layer array.
 */
export function buildChartSpec(
  data: unknown[],
  layers: Spec[],
): Spec {
  return {
    ...baseSpecShell(),
    data: { values: data },
    layer: layers,
  };
}
