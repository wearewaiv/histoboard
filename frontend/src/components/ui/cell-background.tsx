"use client";

import React, { useEffect, useRef, useState } from "react";

interface Cell {
  x: number;
  y: number;
  radius: number;
  nucleusRadius: number;
  nucleusOffsetX: number;
  nucleusOffsetY: number;
  baseOpacity: number;
  rotation: number;
  cellShape: number[];
  nucleusShape: number[];
  chromatinDots: { x: number; y: number; size: number }[];
  hasNucleolus: boolean;
  nucleolusOffset: { x: number; y: number };
  cellType: "round" | "elongated" | "irregular";
  elongation: number;
  clusterId: number;
}

interface Cluster {
  id: number;
  centerX: number;
  centerY: number;
  cells: Cell[];
}

export function CellBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const clustersRef = useRef<Cluster[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Generate irregular shape for membrane/nucleus
  const generateShape = (points: number, irregularity: number): number[] => {
    const shape: number[] = [];
    for (let i = 0; i < points; i++) {
      shape.push(1 - irregularity / 2 + Math.random() * irregularity);
    }
    return shape;
  };

  // Generate chromatin pattern dots inside nucleus
  const generateChromatin = (count: number): { x: number; y: number; size: number }[] => {
    const dots: { x: number; y: number; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.7;
      dots.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 0.05 + Math.random() * 0.1,
      });
    }
    return dots;
  };

  // Check if position is in the hero exclusion zone (top center)
  const isInExclusionZone = (x: number, y: number, width: number, height: number): boolean => {
    // Exclude a rectangular area in the top-center for the hero text
    const exclusionWidth = Math.min(800, width * 0.6);
    const exclusionHeight = 350;
    const exclusionLeft = (width - exclusionWidth) / 2;
    const exclusionTop = 64; // Below header

    return (
      x > exclusionLeft &&
      x < exclusionLeft + exclusionWidth &&
      y > exclusionTop &&
      y < exclusionTop + exclusionHeight
    );
  };

  // Initialize clusters of cells
  useEffect(() => {
    const generateClusters = () => {
      const clusters: Cluster[] = [];
      const cellTypes: ("round" | "elongated" | "irregular")[] = ["round", "round", "round", "elongated", "irregular"];

      // Define cluster positions (corners and edges, avoiding center)
      const clusterPositions: { x: number; y: number }[] = [
        // Top corners
        { x: 80, y: 120 },
        { x: dimensions.width - 80, y: 120 },
        // Bottom corners
        { x: 100, y: dimensions.height - 100 },
        { x: dimensions.width - 100, y: dimensions.height - 100 },
        // Left edge
        { x: 60, y: dimensions.height * 0.4 },
        { x: 80, y: dimensions.height * 0.6 },
        // Right edge
        { x: dimensions.width - 60, y: dimensions.height * 0.4 },
        { x: dimensions.width - 80, y: dimensions.height * 0.6 },
        // Bottom center (below hero)
        { x: dimensions.width * 0.35, y: dimensions.height - 150 },
        { x: dimensions.width * 0.65, y: dimensions.height - 150 },
        // Additional corner clusters
        { x: 150, y: 200 },
        { x: dimensions.width - 150, y: 200 },
      ];

      // Filter out positions in exclusion zone and add some randomness
      const validPositions = clusterPositions.filter(
        (pos) => !isInExclusionZone(pos.x, pos.y, dimensions.width, dimensions.height)
      );

      validPositions.forEach((pos, clusterId) => {
        const clusterCells: Cell[] = [];
        const cellCount = 3 + Math.floor(Math.random() * 3); // 3-5 cells per cluster
        const clusterRadius = 70 + Math.random() * 50; // More spread out clusters

        for (let i = 0; i < cellCount; i++) {
          const cellType = cellTypes[Math.floor(Math.random() * cellTypes.length)];
          // 1.5x bigger cells
          const radius = cellType === "elongated" ? 15 + Math.random() * 12 : 12 + Math.random() * 15;
          const elongation = cellType === "elongated" ? 1.5 + Math.random() * 1 : 1;

          // Position cells around the cluster center
          const angle = (i / cellCount) * Math.PI * 2 + Math.random() * 0.5;
          const dist = Math.random() * clusterRadius;
          const cellX = pos.x + Math.cos(angle) * dist;
          const cellY = pos.y + Math.sin(angle) * dist;

          // Skip if this cell would be in exclusion zone
          if (isInExclusionZone(cellX, cellY, dimensions.width, dimensions.height)) {
            continue;
          }

          clusterCells.push({
            x: cellX,
            y: cellY,
            radius,
            nucleusRadius: radius * (0.35 + Math.random() * 0.15),
            nucleusOffsetX: (Math.random() - 0.5) * radius * 0.25,
            nucleusOffsetY: (Math.random() - 0.5) * radius * 0.25,
            baseOpacity: 0.2 + Math.random() * 0.15,
            rotation: Math.random() * Math.PI * 2,
            cellShape: generateShape(16, cellType === "irregular" ? 0.3 : 0.15),
            nucleusShape: generateShape(12, 0.2),
            chromatinDots: generateChromatin(3 + Math.floor(Math.random() * 4)),
            hasNucleolus: Math.random() > 0.3,
            nucleolusOffset: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 },
            cellType,
            elongation,
            clusterId,
          });
        }

        if (clusterCells.length >= 2) {
          clusters.push({
            id: clusterId,
            centerX: pos.x,
            centerY: pos.y,
            cells: clusterCells,
          });
        }
      });

      clustersRef.current = clusters;
    };

    if (dimensions.width > 0 && dimensions.height > 0) {
      generateClusters();
    }
  }, [dimensions]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Draw organic shape path
  const drawOrganicShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    shape: number[],
    rotation: number
  ) => {
    const points = shape.length;
    ctx.beginPath();

    const getPoint = (index: number) => {
      const angle = (index / points) * Math.PI * 2 + rotation;
      const r = shape[index % points];
      return {
        x: x + Math.cos(angle) * radiusX * r,
        y: y + Math.sin(angle) * radiusY * r,
      };
    };

    const start = getPoint(0);
    ctx.moveTo(start.x, start.y);

    for (let i = 0; i < points; i++) {
      const curr = getPoint(i);
      const next = getPoint((i + 1) % points);
      const cpX = (curr.x + next.x) / 2;
      const cpY = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, cpX, cpY);
    }

    ctx.closePath();
  };

  // Draw function
  const drawCells = (ctx: CanvasRenderingContext2D, mouse: { x: number; y: number }) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    const clusters = clustersRef.current;

    clusters.forEach((cluster) => {
      const cells = cluster.cells;

      // Check if mouse is near this cluster
      const clusterDx = mouse.x - cluster.centerX;
      const clusterDy = mouse.y - cluster.centerY;
      const clusterDist = Math.sqrt(clusterDx * clusterDx + clusterDy * clusterDy);
      const clusterInfluence = Math.max(0, 1 - clusterDist / 150);

      // Draw links between cells in the cluster
      ctx.save();
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const cellA = cells[i];
          const cellB = cells[j];
          const dx = cellB.x - cellA.x;
          const dy = cellB.y - cellA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Only draw links for nearby cells (increased for larger spread)
          if (dist < 120) {
            const linkOpacity = (0.15 + clusterInfluence * 0.25) * (1 - dist / 120);
            ctx.beginPath();
            ctx.moveTo(cellA.x, cellA.y);
            ctx.lineTo(cellB.x, cellB.y);
            ctx.strokeStyle = `rgba(150, 80, 120, ${linkOpacity})`;
            ctx.lineWidth = 1 + clusterInfluence;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw each cell
      cells.forEach((cell) => {
        // Mouse interaction - highlight nearby cells
        const dx = mouse.x - cell.x;
        const dy = mouse.y - cell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 80;
        const influence = Math.max(0, 1 - distance / maxDistance);

        // Increase opacity when mouse is near
        const opacity = cell.baseOpacity + influence * 0.4;
        const radiusX = cell.radius;
        const radiusY = cell.radius / cell.elongation;

        // === Draw Cell Cytoplasm (Eosin - pink/magenta) ===
        const cytoGradient = ctx.createRadialGradient(
          cell.x, cell.y, 0,
          cell.x, cell.y, radiusX
        );
        cytoGradient.addColorStop(0, `rgba(220, 140, 180, ${opacity * 0.9})`);
        cytoGradient.addColorStop(0.4, `rgba(200, 120, 160, ${opacity * 0.7})`);
        cytoGradient.addColorStop(0.75, `rgba(180, 100, 145, ${opacity * 0.5})`);
        cytoGradient.addColorStop(1, `rgba(160, 80, 130, ${opacity * 0.25})`);

        ctx.save();
        drawOrganicShape(ctx, cell.x, cell.y, radiusX, radiusY, cell.cellShape, cell.rotation);
        ctx.fillStyle = cytoGradient;
        ctx.fill();

        // === Draw Cell Membrane ===
        drawOrganicShape(ctx, cell.x, cell.y, radiusX, radiusY, cell.cellShape, cell.rotation);
        ctx.strokeStyle = `rgba(150, 70, 110, ${opacity * 0.8})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // === Draw Nucleus (Hematoxylin - purple/blue) ===
        const nucleusX = cell.x + cell.nucleusOffsetX;
        const nucleusY = cell.y + cell.nucleusOffsetY;
        const nucleusRX = cell.nucleusRadius;
        const nucleusRY = cell.nucleusRadius / cell.elongation;

        const nucleusGradient = ctx.createRadialGradient(
          nucleusX - nucleusRX * 0.15, nucleusY - nucleusRY * 0.15, 0,
          nucleusX, nucleusY, nucleusRX
        );
        nucleusGradient.addColorStop(0, `rgba(70, 30, 100, ${opacity * 1.4})`);
        nucleusGradient.addColorStop(0.3, `rgba(80, 40, 110, ${opacity * 1.2})`);
        nucleusGradient.addColorStop(0.7, `rgba(100, 50, 130, ${opacity * 0.9})`);
        nucleusGradient.addColorStop(1, `rgba(120, 70, 150, ${opacity * 0.5})`);

        ctx.save();
        drawOrganicShape(ctx, nucleusX, nucleusY, nucleusRX, nucleusRY, cell.nucleusShape, cell.rotation * 0.5);
        ctx.fillStyle = nucleusGradient;
        ctx.fill();

        // Nuclear membrane
        drawOrganicShape(ctx, nucleusX, nucleusY, nucleusRX, nucleusRY, cell.nucleusShape, cell.rotation * 0.5);
        ctx.strokeStyle = `rgba(50, 20, 80, ${opacity * 1.0})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // === Draw Chromatin Pattern ===
        cell.chromatinDots.forEach((dot) => {
          const dotX = nucleusX + dot.x * nucleusRX;
          const dotY = nucleusY + dot.y * nucleusRY;
          const dotR = dot.size * nucleusRX;

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40, 15, 60, ${opacity * 0.9})`;
          ctx.fill();
        });

        // === Draw Nucleolus (darker spot) ===
        if (cell.hasNucleolus) {
          const neoX = nucleusX + cell.nucleolusOffset.x * nucleusRX;
          const neoY = nucleusY + cell.nucleolusOffset.y * nucleusRY;
          const neoR = nucleusRX * 0.25;

          const neoGradient = ctx.createRadialGradient(
            neoX - neoR * 0.2, neoY - neoR * 0.2, 0,
            neoX, neoY, neoR
          );
          neoGradient.addColorStop(0, `rgba(30, 10, 50, ${opacity * 1.5})`);
          neoGradient.addColorStop(1, `rgba(50, 25, 70, ${opacity * 1.0})`);

          ctx.beginPath();
          ctx.arc(neoX, neoY, neoR, 0, Math.PI * 2);
          ctx.fillStyle = neoGradient;
          ctx.fill();
        }

        // === Draw glow effect for highlighted cells ===
        if (influence > 0.1) {
          ctx.save();
          drawOrganicShape(ctx, cell.x, cell.y, radiusX * 1.15, radiusY * 1.15, cell.cellShape, cell.rotation);
          ctx.strokeStyle = `rgba(180, 100, 150, ${influence * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      });
    });
  };

  // Render loop - only redraws when mouse moves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initial draw
    drawCells(ctx, mouseRef.current);

    // Redraw on mouse move with throttling
    let frameId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (frameId === null) {
        frameId = requestAnimationFrame(() => {
          drawCells(ctx, mouseRef.current);
          frameId = null;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
