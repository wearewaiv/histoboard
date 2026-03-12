/**
 * PixiJS Cell Background — Core Module
 *
 * Pure vanilla TypeScript, zero React. Renders organic biological cells
 * as a decorative background using PixiJS v8 (GPU-accelerated).
 *
 * Entry point: initCellBackground(container) → CellFieldHandle
 */

import { Application, Container, Graphics } from "pixi.js";
import { createNoise2D } from "simplex-noise";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CellFieldHandle {
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type CellType = "round" | "elongated";

interface CellConfig {
  radius: number;
  elongation: number;
  cellType: CellType;
  rotation: number;
  baseOpacity: number;
  // Membrane shape (24 pts, high irregularity → ruffled edges)
  cellShape: number[];
  // Cytoplasmic granules (vesicles, darker eosin spots)
  granules: { angle: number; dist: number; size: number }[];
  // Nucleus (cancer: large, lobulated, 50-70% of cell)
  nucleusRadiusFrac: number;
  nucleusOffsetX: number;
  nucleusOffsetY: number;
  nucleusShape: number[];
  // Nucleoli (prominent, bright magenta)
  nucleoli: { angle: number; dist: number; radius: number; elongation: number; shape: number[]; rotation: number }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


// H&E staining palette — Realistic histology colors
// Eosin (cytoplasm / stroma)
const COL_CYTO = 0xf0b0c8; // soft eosin pink
const COL_CYTO_GRANULE = 0xd88898; // darker vesicle granules
const COL_MEMBRANE = 0xc06090; // cell membrane (deeper pink)
// Hematoxylin (nuclei / chromatin)
const COL_NUCLEUS = 0x3a2878; // deep purple-indigo
const COL_NUC_BORDER = 0x4a3898; // thick nuclear membrane
const COL_NUCLEOLUS = 0xc03870; // bright magenta nucleolus
// Stroma / tissue blobs / connections
const COL_STROMA = 0x7477b8; // lilac

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

function generateShape(points: number, irregularity: number): number[] {
  const shape: number[] = [];
  for (let i = 0; i < points; i++) {
    shape.push(1 - irregularity / 2 + Math.random() * irregularity);
  }
  return shape;
}

function generateGranules(count: number) {
  const out: { angle: number; dist: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: Math.random() * Math.PI * 2,
      dist: 0.35 + Math.random() * 0.55, // between nucleus edge and membrane
      size: 0.6 + Math.random() * 1.2,
    });
  }
  return out;
}

function generateNucleoli(count: number) {
  const out: {
    angle: number;
    dist: number;
    radius: number;
    elongation: number;
    shape: number[];
    rotation: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.35,
      radius: 0.10 + Math.random() * 0.25,
      elongation: 0.7 + Math.random() * 0.6, // oval, not round
      shape: generateShape(10, 0.2), // irregular outline
      rotation: Math.random() * Math.PI * 2,
    });
  }
  return out;
}

// Draw an organic closed path onto a Graphics object (local coords centered at 0,0)
function drawOrganicPath(
  g: Graphics,
  rx: number,
  ry: number,
  shape: number[],
  rotation: number,
) {
  const pts = shape.length;
  const pt = (idx: number) => {
    const a = (idx / pts) * Math.PI * 2 + rotation;
    const r = shape[idx % pts];
    return { x: Math.cos(a) * rx * r, y: Math.sin(a) * ry * r };
  };

  const start = pt(0);
  g.moveTo(start.x, start.y);

  for (let i = 0; i < pts; i++) {
    const curr = pt(i);
    const next = pt((i + 1) % pts);
    g.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
  }
  g.closePath();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BORDER_MARGIN = 40; // keep cells away from page edges

// ---------------------------------------------------------------------------
// Content backdrop — straight vertical opaque band in the center
// ---------------------------------------------------------------------------

const COL_BACKDROP = 0xf9f5f1; // page background ≈ hsl(30 25% 97%)

// Measure the page content area (content-box of the container, excluding padding)
function getContainerBand(fallbackW: number): { left: number; width: number } {
  // Use main's first child — the page's <div class="container mx-auto px-4 ...">
  const main = document.querySelector("main");
  const el = main?.firstElementChild;
  if (el) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const pl = parseFloat(style.paddingLeft) || 0;
    const pr = parseFloat(style.paddingRight) || 0;
    return { left: rect.left + pl, width: rect.width - pl - pr };
  }
  // Fallback if no content container found
  return { left: 0, width: fallbackW };
}

function drawContentBackdrop(g: Graphics, w: number, h: number) {
  const band = getContainerBand(w);
  g.rect(band.left, 0, band.width, h);
  g.fill({ color: COL_BACKDROP, alpha: 0.75 });
}

// ---------------------------------------------------------------------------
// Build cell display objects
// ---------------------------------------------------------------------------

function buildCellGraphics(cfg: CellConfig): { container: Container } {
  const container = new Container();
  const rx = cfg.radius;
  const ry = cfg.radius / cfg.elongation;
  const alpha = cfg.baseOpacity;

  // --- Cytoplasm: semi-transparent eosin pink fill ---
  const cyto = new Graphics();
  drawOrganicPath(cyto, rx, ry, cfg.cellShape, cfg.rotation);
  cyto.fill({ color: COL_CYTO, alpha: alpha * 0.22 });
  container.addChild(cyto);

  // --- Cytoplasmic granules (dark vesicles scattered in cytoplasm) ---
  if (cfg.granules.length > 0) {
    const granG = new Graphics();
    for (const g of cfg.granules) {
      const gx = Math.cos(g.angle) * g.dist * rx;
      const gy = Math.sin(g.angle) * g.dist * ry;
      granG.circle(gx, gy, g.size);
    }
    granG.fill({ color: COL_CYTO_GRANULE, alpha: alpha * 0.3 });
    container.addChild(granG);
  }

  // --- Cell membrane (irregular, ruffled stroke) ---
  const memb = new Graphics();
  drawOrganicPath(memb, rx, ry, cfg.cellShape, cfg.rotation);
  memb.stroke({ color: COL_MEMBRANE, alpha: alpha * 0.5, width: 1.3 });
  container.addChild(memb);

  // --- Nucleus (large, lobulated — high N:C ratio) ---
  const nrx = cfg.radius * cfg.nucleusRadiusFrac;
  const nry = nrx / cfg.elongation;
  const nOx = cfg.nucleusOffsetX;
  const nOy = cfg.nucleusOffsetY;
  const nRot = cfg.rotation + 0.3;

  // Nucleus fill — deep purple/indigo
  const nucG = new Graphics();
  drawOrganicPath(nucG, nrx, nry, cfg.nucleusShape, nRot);
  nucG.fill({ color: COL_NUCLEUS, alpha: alpha * 0.35 });
  // Thick irregular nuclear membrane
  drawOrganicPath(nucG, nrx, nry, cfg.nucleusShape, nRot);
  nucG.stroke({ color: COL_NUC_BORDER, alpha: alpha * 0.55, width: 1.5 });
  nucG.position.set(nOx, nOy);
  container.addChild(nucG);

  // --- Nucleolus (single, prominent, bright magenta with erratic shape) ---
  for (const neo of cfg.nucleoli) {
    const neoX = nOx + Math.cos(neo.angle) * neo.dist * nrx;
    const neoY = nOy + Math.sin(neo.angle) * neo.dist * nry;
    const neoRx = neo.radius * nrx;
    const neoRy = neoRx * neo.elongation;
    // Glow halo
    const halo = new Graphics();
    drawOrganicPath(halo, neoRx * 1.6, neoRy * 1.6, neo.shape, neo.rotation);
    halo.fill({ color: COL_NUCLEOLUS, alpha: alpha * 0.12 });
    halo.position.set(neoX, neoY);
    container.addChild(halo);
    // Core
    const core = new Graphics();
    drawOrganicPath(core, neoRx, neoRy, neo.shape, neo.rotation);
    core.fill({ color: COL_NUCLEOLUS, alpha: alpha * 0.55 });
    core.position.set(neoX, neoY);
    container.addChild(core);
  }

  return { container };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function initCellBackground(
  containerEl: HTMLElement,
): Promise<CellFieldHandle> {
  const app = new Application();

  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resizeTo: containerEl,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  // Style the canvas to fill the container
  const canvas = app.canvas as HTMLCanvasElement;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  containerEl.appendChild(canvas);

  // Per-cell state
  const cellContainers: Container[] = [];
  const cellOrigins: { x: number; y: number }[] = [];
  const cellRadii: number[] = [];
  // Persistent repulsion offsets (smoothly accumulated across frames)
  const repulsionOffsets: { dx: number; dy: number }[] = [];

  // Layers (bottom → top: lines, cells, content backdrop)
  const linesContainer = new Container();
  const cellsContainer = new Container();
  const backdropLayer = new Container();
  app.stage.addChild(linesContainer);
  app.stage.addChild(cellsContainer);
  app.stage.addChild(backdropLayer);

  // --- Build function (called on init + resize) ---
  function build() {
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    // Clear previous
    cellsContainer.removeChildren();
    linesContainer.removeChildren();
    backdropLayer.removeChildren();
    cellContainers.length = 0;
    cellOrigins.length = 0;
    cellRadii.length = 0;
    repulsionOffsets.length = 0;

    // Content backdrop (opaque vertical band dims cells behind text)
    const backdrop = new Graphics();
    drawContentBackdrop(backdrop, w, h);
    backdropLayer.addChild(backdrop);

    // --- Sparsely scattered individual cells ---
    const CELL_DENSITY = 0.00008;
    const area = w * h;
    const cellCount = Math.floor(area * CELL_DENSITY);

    for (let i = 0; i < cellCount; i++) {
      const cx = BORDER_MARGIN + Math.random() * (w - BORDER_MARGIN * 2);
      const cy = BORDER_MARGIN + Math.random() * (h - BORDER_MARGIN * 2);

      const radius = 14 + Math.random() * 18;
      const cellType: CellType = Math.random() > 0.6 ? "elongated" : "round";
      const elongation = cellType === "elongated" ? 1.15 + Math.random() * 0.3 : 1;
      const rotation = Math.random() * Math.PI * 2;

      const cfg: CellConfig = {
        radius,
        elongation,
        cellType,
        rotation,
        baseOpacity: 0.4 + Math.random() * 0.3,
        cellShape: generateShape(24, 0.12),
        granules: generateGranules(4 + Math.floor(Math.random() * 6)),
        nucleusRadiusFrac: 0.30 + Math.random() * 0.45,
        nucleusOffsetX: (Math.random() - 0.5) * radius * 0.3,
        nucleusOffsetY: (Math.random() - 0.5) * radius * 0.3,
        nucleusShape: generateShape(16, 0.14),
        nucleoli: generateNucleoli(1),
      };

      const { container: cellContainer } = buildCellGraphics(cfg);
      cellContainer.position.set(cx, cy);
      cellsContainer.addChild(cellContainer);

      cellContainers.push(cellContainer);
      cellOrigins.push({ x: cx, y: cy });
      cellRadii.push(radius);
      repulsionOffsets.push({ dx: 0, dy: 0 });
    }

    // Persistent Graphics for connecting lines (redrawn each frame)
    const linesG = new Graphics();
    linesContainer.addChild(linesG);
  }

  // --- Initial build ---
  build();

  // --- Mouse tracking (for link highlight) ---
  let mouseX = -9999;
  let mouseY = -9999;
  const HOVER_RADIUS = 120;
  const COL_HIGHLIGHT = 0xff5a60;

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  document.addEventListener("mousemove", onMouseMove);

  // --- Per-cell drift + repulsion ---
  const driftNoise = createNoise2D();
  const DRIFT_SPEED = 0.00003;
  const DRIFT_RANGE = 200;
  const CONNECTION_DIST = 120;

  const REPULSION_STRENGTH = 0.05;
  const REPULSION_PADDING = 10;
  const REPULSION_DECAY = 0.97;

  const tickFn = () => {
    const now = performance.now();
    const t = now * DRIFT_SPEED;
    const n = cellContainers.length;

    // 1. Compute per-cell noise-based drift
    const driftOffsets: { dx: number; dy: number }[] = [];
    for (let i = 0; i < n; i++) {
      const dx = driftNoise(t, i * 100) * DRIFT_RANGE;
      const dy = driftNoise(t + 999, i * 100 + 50) * DRIFT_RANGE;
      driftOffsets.push({ dx, dy });
    }

    // 2. Pairwise cell repulsion — prevent overlap
    for (let i = 0; i < n; i++) {
      const oi = cellOrigins[i];
      const xi = oi.x + driftOffsets[i].dx + repulsionOffsets[i].dx;
      const yi = oi.y + driftOffsets[i].dy + repulsionOffsets[i].dy;
      for (let j = i + 1; j < n; j++) {
        const oj = cellOrigins[j];
        const xj = oj.x + driftOffsets[j].dx + repulsionOffsets[j].dx;
        const yj = oj.y + driftOffsets[j].dy + repulsionOffsets[j].dy;

        const dx = xi - xj;
        const dy = yi - yj;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = cellRadii[i] + cellRadii[j] + REPULSION_PADDING;

        if (dist < minDist && dist > 1) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const push = overlap * REPULSION_STRENGTH;
          repulsionOffsets[i].dx += nx * push;
          repulsionOffsets[i].dy += ny * push;
          repulsionOffsets[j].dx -= nx * push;
          repulsionOffsets[j].dy -= ny * push;
        }
      }
    }

    // Decay repulsion so offsets release when cells drift apart
    for (const ro of repulsionOffsets) {
      ro.dx *= REPULSION_DECAY;
      ro.dy *= REPULSION_DECAY;
    }

    // 3. Set final cell positions (origin + drift + repulsion)
    const worldPos: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const o = cellOrigins[i];
      const wx = o.x + driftOffsets[i].dx + repulsionOffsets[i].dx;
      const wy = o.y + driftOffsets[i].dy + repulsionOffsets[i].dy;
      cellContainers[i].position.set(wx, wy);
      worldPos.push({ x: wx, y: wy });
    }

    // 4. Redraw connecting lines with hover highlight
    const linesG = linesContainer.children[0] as Graphics | undefined;
    if (linesG) {
      linesG.clear();
      for (let i = 0; i < n; i++) {
        const a = worldPos[i];
        for (let j = i + 1; j < n; j++) {
          const b = worldPos[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < CONNECTION_DIST) {
            const dMouseA = Math.sqrt((mouseX - a.x) ** 2 + (mouseY - a.y) ** 2);
            const dMouseB = Math.sqrt((mouseX - b.x) ** 2 + (mouseY - b.y) ** 2);
            const hoverInfluence = Math.max(
              Math.max(0, 1 - dMouseA / HOVER_RADIUS),
              Math.max(0, 1 - dMouseB / HOVER_RADIUS),
            );

            const baseAlpha = 0.14 * (1 - dist / CONNECTION_DIST);
            const color = hoverInfluence > 0 ? COL_HIGHLIGHT : COL_STROMA;
            const alpha = baseAlpha + hoverInfluence * 0.4;
            const width = 1 + hoverInfluence * 1.5;

            linesG.moveTo(a.x, a.y);
            linesG.lineTo(b.x, b.y);
            linesG.stroke({ color, alpha, width });
          }
        }
      }
    }
  };

  app.ticker.add(tickFn);

  // --- Resize handling ---
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const ro = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
    }, 200);
  });
  ro.observe(containerEl);

  // --- Destroy ---
  function destroy() {
    app.ticker.remove(tickFn);
    document.removeEventListener("mousemove", onMouseMove);
    ro.disconnect();
    if (resizeTimer) clearTimeout(resizeTimer);
    app.destroy(true, { children: true });
  }

  return { destroy };
}
