"use client";

/**
 * Client-side Vega-Lite renderer with responsive width.
 *
 * Uses a ResizeObserver to measure the container's pixel width and injects
 * it into the Vega-Lite spec, replacing `width: "container"` with an actual
 * number. This ensures charts resize correctly when the viewport changes.
 *
 * Not imported directly — use {@link VegaChart} which handles the SSR boundary.
 *
 * @module components/charts/VegaChartInner
 */

import { useRef, useEffect, useState } from "react";
import vegaEmbed from "vega-embed";

interface VegaChartInnerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: Record<string, any>;
  className?: string;
}

export function VegaChartInner({ spec, className }: VegaChartInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width on mount and resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render chart when spec or measured width changes
  useEffect(() => {
    if (!containerRef.current || containerWidth === 0) return;

    // Clean up previous view
    if (viewRef.current) {
      viewRef.current.finalize();
      viewRef.current = null;
    }

    // Inject measured pixel width into the spec
    const resolvedSpec = {
      ...spec,
      width: containerWidth,
    };

    let cancelled = false;

    vegaEmbed(containerRef.current, resolvedSpec, {
      actions: false,
      renderer: "canvas",
    })
      .then((result) => {
        if (!cancelled) {
          viewRef.current = result.view;
        } else {
          result.view.finalize();
        }
      })
      .catch((err) => {
        console.error("Vega-Lite render error:", err);
      });

    return () => {
      cancelled = true;
      if (viewRef.current) {
        viewRef.current.finalize();
        viewRef.current = null;
      }
    };
  }, [spec, containerWidth]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", minHeight: 480 }}
    />
  );
}
