"use client";

/**
 * Cell Background — Thin React wrapper
 *
 * Delegates all rendering to the vanilla TS PixiJS module (lib/pixiCells.ts).
 * Uses dynamic import() to avoid SSR (PixiJS needs WebGL/DOM).
 */

import { useEffect, useRef } from "react";
import type { CellFieldHandle } from "@/lib/pixiCells";

export function CellBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<CellFieldHandle | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    // Dynamic import avoids SSR (PixiJS needs WebGL)
    import("@/lib/pixiCells").then(({ initCellBackground }) => {
      if (cancelled) return;
      initCellBackground(el).then((handle) => {
        if (cancelled) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
      });
    });

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
