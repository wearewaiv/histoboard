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
  // Chromatin clumps (hyperchromatic, irregular blobs)
  chromatinClumps: {
    angle: number;
    dist: number;
    rx: number;
    ry: number;
    shape: number[];
    rotation: number;
  }[];
  // Nucleoli (1-3, prominent, bright magenta)
  nucleoli: { angle: number; dist: number; radius: number }[];
}

interface CellDisplay {
  container: Container;
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
const COL_CHROMATIN = 0x2a1860; // dark hyperchromatic clumps
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

function generateChromatinClumps(count: number) {
  const out: {
    angle: number;
    dist: number;
    rx: number;
    ry: number;
    shape: number[];
    rotation: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.6,
      rx: 0.12 + Math.random() * 0.18, // as fraction of nucleus radius
      ry: 0.08 + Math.random() * 0.14,
      shape: generateShape(8, 0.15),
      rotation: Math.random() * Math.PI * 2,
    });
  }
  return out;
}

function generateNucleoli(count: number) {
  const out: { angle: number; dist: number; radius: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.35,
      radius: 0.13 + Math.random() * 0.1, // as fraction of nucleus radius
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

  // --- Chromatin clumps (hyperchromatic, irregular blobs inside nucleus) ---
  if (cfg.chromatinClumps.length > 0) {
    const chromG = new Graphics();
    for (const clump of cfg.chromatinClumps) {
      const cx = nOx + Math.cos(clump.angle) * clump.dist * nrx;
      const cy = nOy + Math.sin(clump.angle) * clump.dist * nry;
      const crx = clump.rx * nrx;
      const cry = clump.ry * nry;
      // Draw each clump as an irregular blob
      const clumpG = new Graphics();
      drawOrganicPath(clumpG, crx, cry, clump.shape, clump.rotation);
      clumpG.fill({ color: COL_CHROMATIN, alpha: alpha * 0.5 });
      clumpG.position.set(cx, cy);
      container.addChild(clumpG);
    }
    // Also small scattered chromatin specks
    for (const clump of cfg.chromatinClumps) {
      const sx = nOx + Math.cos(clump.angle + 0.5) * clump.dist * nrx * 0.7;
      const sy = nOy + Math.sin(clump.angle + 0.5) * clump.dist * nry * 0.7;
      chromG.circle(sx, sy, nrx * 0.04);
    }
    chromG.fill({ color: COL_CHROMATIN, alpha: alpha * 0.4 });
    container.addChild(chromG);
  }

  // --- Nucleoli (1-3, prominent, bright magenta with subtle glow) ---
  for (const neo of cfg.nucleoli) {
    const neoX = nOx + Math.cos(neo.angle) * neo.dist * nrx;
    const neoY = nOy + Math.sin(neo.angle) * neo.dist * nry;
    const neoR = neo.radius * nrx;
    // Glow halo
    const halo = new Graphics();
    halo.circle(neoX, neoY, neoR * 1.6);
    halo.fill({ color: COL_NUCLEOLUS, alpha: alpha * 0.12 });
    container.addChild(halo);
    // Core
    const core = new Graphics();
    core.circle(neoX, neoY, neoR);
    core.fill({ color: COL_NUCLEOLUS, alpha: alpha * 0.55 });
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

  // State
  const configs: CellConfig[] = [];
  const displays: CellDisplay[] = [];
  const clusterContainers: Container[] = [];
  const clusterOrigins: { x: number; y: number }[] = [];
  // Per-cell mapping to cluster + local offset (for dynamic line drawing)
  const cellClusterMap: { clusterIdx: number; lx: number; ly: number }[] = [];
  // Per-cluster effective radii (for repulsion)
  const clusterRadii: number[] = [];
  // Persistent repulsion offsets (smoothly accumulated across frames)
  const repulsionOffsets: { dx: number; dy: number }[] = [];

  // Layers (bottom → top: stroma ECM, cells, content backdrop)
  const stromaContainer = new Container();
  const cellsContainer = new Container();
  const backdropLayer = new Container();
  app.stage.addChild(stromaContainer);
  app.stage.addChild(cellsContainer);
  app.stage.addChild(backdropLayer);

  // --- Build function (called on init + resize) ---
  function build() {
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    // Clear previous
    cellsContainer.removeChildren();
    stromaContainer.removeChildren();
    backdropLayer.removeChildren();
    configs.length = 0;
    displays.length = 0;
    clusterContainers.length = 0;
    clusterOrigins.length = 0;
    cellClusterMap.length = 0;
    clusterRadii.length = 0;
    repulsionOffsets.length = 0;

    // Content backdrop (opaque vertical band dims cells behind text)
    const backdrop = new Graphics();
    drawContentBackdrop(backdrop, w, h);
    backdropLayer.addChild(backdrop);

    // --- Sparsely scattered cells ---
    const CELL_DENSITY = 0.00008; // very sparse, sporadic
    const area = w * h;
    const cellCount = Math.floor(area * CELL_DENSITY);

    // Collect cell positions for clustering
    const cellPositions: { x: number; y: number }[] = [];

    for (let i = 0; i < cellCount; i++) {
      const cx = BORDER_MARGIN + Math.random() * (w - BORDER_MARGIN * 2);
      const cy = BORDER_MARGIN + Math.random() * (h - BORDER_MARGIN * 2);
      cellPositions.push({ x: cx, y: cy });
    }

    // --- Group cells into clusters ---
    const CLUSTER_RADIUS = 80;
    const claimed = new Set<number>();
    const clusterDefs: { cx: number; cy: number; members: { x: number; y: number }[] }[] = [];

    for (let i = 0; i < cellPositions.length; i++) {
      if (claimed.has(i)) continue;
      const members = [cellPositions[i]];
      claimed.add(i);
      for (let j = i + 1; j < cellPositions.length; j++) {
        if (claimed.has(j)) continue;
        const near = members.some((m) => {
          const dx = m.x - cellPositions[j].x;
          const dy = m.y - cellPositions[j].y;
          return Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS;
        });
        if (near) {
          members.push(cellPositions[j]);
          claimed.add(j);
        }
      }
      const cx = members.reduce((s, m) => s + m.x, 0) / members.length;
      const cy = members.reduce((s, m) => s + m.y, 0) / members.length;
      clusterDefs.push({ cx, cy, members });
    }

    // --- Build each cluster as a single container (tissue blob + cells + lines) ---
    for (let ci = 0; ci < clusterDefs.length; ci++) {
      const cluster = clusterDefs[ci];
      const group = new Container();
      group.position.set(cluster.cx, cluster.cy);

      // Tissue blob
      let maxDist = 0;
      for (const m of cluster.members) {
        const d = Math.sqrt((m.x - cluster.cx) ** 2 + (m.y - cluster.cy) ** 2);
        if (d > maxDist) maxDist = d;
      }
      const blobR = maxDist + 25 + Math.random() * 15;
      const blobRy = blobR * (0.8 + Math.random() * 0.4);
      const blobShape = generateShape(20, 0.15);
      const blobRot = Math.random() * Math.PI * 2;

      const haloG = new Graphics();
      drawOrganicPath(haloG, blobR * 1.15, blobRy * 1.15, blobShape, blobRot);
      haloG.fill({ color: COL_STROMA, alpha: 0.06 });
      group.addChild(haloG);

      const innerG = new Graphics();
      drawOrganicPath(innerG, blobR, blobRy, blobShape, blobRot);
      innerG.fill({ color: COL_STROMA, alpha: 0.1 });
      group.addChild(innerG);

      // Cells (positioned relative to cluster center)
      for (const pos of cluster.members) {
        const lx = pos.x - cluster.cx;
        const ly = pos.y - cluster.cy;
        cellClusterMap.push({ clusterIdx: ci, lx, ly });
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
          // 24-point shape with higher irregularity → ruffled, non-circular membrane
          cellShape: generateShape(24, 0.12),
          // Cytoplasmic granules (scattered vesicles)
          granules: generateGranules(4 + Math.floor(Math.random() * 6)),
          // Large nucleus — cancer cell N:C ratio (50-70% of cell)
          nucleusRadiusFrac: 0.50 + Math.random() * 0.20,
          nucleusOffsetX: (Math.random() - 0.5) * radius * 0.3,
          nucleusOffsetY: (Math.random() - 0.5) * radius * 0.3,
          // Lobulated nucleus (16 points, high irregularity)
          nucleusShape: generateShape(16, 0.14),
          // Hyperchromatic chromatin clumps
          chromatinClumps: generateChromatinClumps(3 + Math.floor(Math.random() * 4)),
          // 1-3 prominent nucleoli
          nucleoli: generateNucleoli(1 + Math.floor(Math.random() * 3)),
        };

        const { container: cellContainer } = buildCellGraphics(cfg);
        cellContainer.position.set(lx, ly);
        group.addChild(cellContainer);
        configs.push(cfg);
        displays.push({ container: cellContainer });
      }

      // Track cluster for animation
      clusterContainers.push(group);
      clusterOrigins.push({ x: cluster.cx, y: cluster.cy });
      clusterRadii.push(blobR);
      repulsionOffsets.push({ dx: 0, dy: 0 });
      cellsContainer.addChild(group);
    }

    // --- Global connecting lines (redrawn each frame in tick) ---
    // Add a persistent Graphics to stromaContainer; tick redraws it.
    const linesG = new Graphics();
    stromaContainer.addChild(linesG);
  }

  // --- Initial build ---
  build();

  // --- Mouse tracking (for link highlight) ---
  let mouseX = -9999;
  let mouseY = -9999;
  const HOVER_RADIUS = 120; // px — highlight links when mouse is within this of either endpoint
  const COL_HIGHLIGHT = 0xff5a60; // coral highlight

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  document.addEventListener("mousemove", onMouseMove);

  // --- Continuous cluster drift using noise ---
  const driftNoise = createNoise2D();
  const DRIFT_SPEED = 0.00003; // very slow, glacial movement
  const DRIFT_RANGE = 200; // pixels — large wander across the whole page
  const CONNECTION_DIST = 120;

  const REPULSION_STRENGTH = 0.05; // how fast clusters push apart per frame
  const REPULSION_PADDING = 20; // extra gap beyond blob radii
  const REPULSION_DECAY = 0.97; // slow decay so offsets don't accumulate forever

  const tickFn = () => {
    const now = performance.now();
    const t = now * DRIFT_SPEED;

    // 1. Compute noise-based drift offsets
    const driftOffsets: { dx: number; dy: number }[] = [];
    for (let i = 0; i < clusterContainers.length; i++) {
      const dx = driftNoise(t, i * 100) * DRIFT_RANGE;
      const dy = driftNoise(t + 999, i * 100 + 50) * DRIFT_RANGE;
      driftOffsets.push({ dx, dy });
    }

    // 2. Pairwise repulsion — push overlapping clusters apart
    for (let i = 0; i < clusterContainers.length; i++) {
      const oi = clusterOrigins[i];
      const xi = oi.x + driftOffsets[i].dx + repulsionOffsets[i].dx;
      const yi = oi.y + driftOffsets[i].dy + repulsionOffsets[i].dy;
      for (let j = i + 1; j < clusterContainers.length; j++) {
        const oj = clusterOrigins[j];
        const xj = oj.x + driftOffsets[j].dx + repulsionOffsets[j].dx;
        const yj = oj.y + driftOffsets[j].dy + repulsionOffsets[j].dy;

        const dx = xi - xj;
        const dy = yi - yj;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = clusterRadii[i] + clusterRadii[j] + REPULSION_PADDING;

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

    // Decay repulsion so offsets release when clusters drift apart
    for (const ro of repulsionOffsets) {
      ro.dx *= REPULSION_DECAY;
      ro.dy *= REPULSION_DECAY;
    }

    // 3. Set final cluster positions (noise + repulsion)
    for (let i = 0; i < clusterContainers.length; i++) {
      const o = clusterOrigins[i];
      clusterContainers[i].position.set(
        o.x + driftOffsets[i].dx + repulsionOffsets[i].dx,
        o.y + driftOffsets[i].dy + repulsionOffsets[i].dy,
      );
    }

    // 4. Precompute world positions of all cells
    const worldPos: { x: number; y: number }[] = [];
    for (let i = 0; i < cellClusterMap.length; i++) {
      const ci = cellClusterMap[i];
      const co = clusterOrigins[ci.clusterIdx];
      const d = driftOffsets[ci.clusterIdx];
      const r = repulsionOffsets[ci.clusterIdx];
      worldPos.push({
        x: co.x + d.dx + r.dx + ci.lx,
        y: co.y + d.dy + r.dy + ci.ly,
      });
    }

    // Redraw connecting lines with hover highlight
    const linesG = stromaContainer.children[0] as Graphics | undefined;
    if (linesG) {
      linesG.clear();
      for (let i = 0; i < worldPos.length; i++) {
        const a = worldPos[i];
        for (let j = i + 1; j < worldPos.length; j++) {
          const b = worldPos[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < CONNECTION_DIST) {
            // Check mouse proximity to either endpoint
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
