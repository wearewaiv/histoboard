/**
 * Shared color palette and formatting utilities for chart components.
 */

/** Color palette for model scatter plots (35 distinct colors). */
export const MODEL_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#06b6d4", "#a855f7", "#10b981", "#eab308", "#0ea5e9",
  "#d946ef", "#64748b", "#78716c", "#fb7185", "#4ade80",
  "#60a5fa", "#c084fc", "#facc15", "#2dd4bf", "#fb923c",
  "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f472b6",
  "#818cf8", "#4f46e5", "#dc2626", "#16a34a", "#ca8a04",
];

/** Get color for a model at a given index, cycling through the palette. */
export function getModelColor(index: number): string {
  return MODEL_COLORS[index % MODEL_COLORS.length];
}

/** Format parameter count for display (e.g., 632 → "632M", 1100 → "1.1B"). */
export function formatParams(params: number): string {
  if (params >= 1000) {
    return `${(params / 1000).toFixed(1)}B`;
  }
  return `${Math.round(params)}M`;
}

/**
 * Greedy label placement for scatter-plot text labels.
 *
 * For each point tries 4 candidate positions (NE, NW, SE, SW) and picks the
 * one whose estimated bounding-box overlaps least with already-placed labels
 * and other data-point markers.
 *
 * Returns a direction string per point ("NE" | "NW" | "SE" | "SW").
 * Use {@link LABEL_DIR_STYLE} to map directions to Vega mark properties.
 */
export type LabelDir = "NE" | "NW" | "SE" | "SW";

export const LABEL_DIR_STYLE: Record<
  LabelDir,
  { dx: number; dy: number; align: "left" | "right" }
> = {
  NE: { dx: 10, dy: -10, align: "left" },
  NW: { dx: -10, dy: -10, align: "right" },
  SE: { dx: 10, dy: 16, align: "left" },
  SW: { dx: -10, dy: 16, align: "right" },
};

const DIR_KEYS: LabelDir[] = ["NE", "NW", "SE", "SW"];

export function computeLabelPlacements(
  points: Array<{ x: number; y: number; label: string }>,
  xDomain: [number, number],
  yDomain: [number, number],
  chartWidth = 900,
  chartHeight = 480,
): LabelDir[] {
  const CHAR_W = 6.5; // approximate pixels per character at fontSize 11
  const LABEL_H = 16;
  const POINT_R = 8;  // approximate point marker radius in pixels

  const xRange = xDomain[1] - xDomain[0];
  const yRange = yDomain[1] - yDomain[0];
  if (xRange === 0 || yRange === 0) {
    return points.map(() => "NE");
  }

  // Convert data coords → approximate pixel coords
  const pxPts = points.map((p) => ({
    px: ((p.x - xDomain[0]) / xRange) * chartWidth,
    py: chartHeight - ((p.y - yDomain[0]) / yRange) * chartHeight,
    labelW: p.label.length * CHAR_W,
  }));

  // Rectangle helper: [x1, y1, x2, y2]
  type Rect = [number, number, number, number];

  function labelRect(i: number, dir: LabelDir): Rect {
    const s = LABEL_DIR_STYLE[dir];
    const { px, py, labelW } = pxPts[i];
    const x = px + s.dx;
    const y = py + s.dy - LABEL_H / 2;
    return s.align === "left"
      ? [x, y, x + labelW, y + LABEL_H]
      : [x - labelW, y, x, y + LABEL_H];
  }

  function overlapArea(a: Rect, b: Rect): number {
    const dx = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
    const dy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
    return dx > 0 && dy > 0 ? dx * dy : 0;
  }

  const placed: Rect[] = [];

  return pxPts.map((_, i) => {
    let bestDir: LabelDir = "NE";
    let bestScore = Infinity;

    for (const dir of DIR_KEYS) {
      const rect = labelRect(i, dir);
      let score = 0;

      // Penalise overlap with already-placed labels
      for (const p of placed) score += overlapArea(rect, p);

      // Penalise overlap with all point markers
      for (let j = 0; j < pxPts.length; j++) {
        if (j === i) continue;
        const pr: Rect = [
          pxPts[j].px - POINT_R,
          pxPts[j].py - POINT_R,
          pxPts[j].px + POINT_R,
          pxPts[j].py + POINT_R,
        ];
        score += overlapArea(rect, pr);
      }

      if (score < bestScore) {
        bestScore = score;
        bestDir = dir;
      }
    }

    placed.push(labelRect(i, bestDir));
    return bestDir;
  });
}
