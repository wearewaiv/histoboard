"use client";

/**
 * SSR-safe Vega-Lite chart wrapper.
 *
 * Uses Next.js dynamic import with `ssr: false` to ensure vega-embed
 * (which requires the DOM) is never loaded during server-side rendering.
 * This is the component that chart consumers should import.
 *
 * @see VegaChartInner for the actual rendering logic.
 * @see {@link module:lib/vegaSpecBuilder} for utilities to construct the `spec` prop.
 * @module components/charts/VegaChart
 */

import dynamic from "next/dynamic";
const VegaChartInner = dynamic(
  () => import("./VegaChartInner").then((mod) => mod.VegaChartInner),
  { ssr: false, loading: () => <div style={{ minHeight: 480 }} /> }
);

interface VegaChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: Record<string, any>;
  className?: string;
}

export function VegaChart({ spec, className }: VegaChartProps) {
  return <VegaChartInner spec={spec} className={className} />;
}
