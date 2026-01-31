import type { Result, Task, Model } from "@/types";

export interface ScalingLawsDataPoint {
  modelId: string;
  modelName: string;
  organization: string;
  robustness: number;
  performance: number;
  params: number;
  benchmarkCount: number;
}

// Parse model params: "632M" → 632, "1.1B" → 1100
export function parseModelParams(params: string): number {
  const value = parseFloat(params);
  if (params.toUpperCase().includes("B")) {
    return value * 1000; // Convert billions to millions
  }
  return value; // Already in millions
}

// Robustness benchmarks configuration
export const ALL_ROBUSTNESS_BENCHMARKS = [
  { id: "pathorob", label: "PathoROB" },
  { id: "plism", label: "Plismbench" },
];

export const DEFAULT_SELECTED_ROBUSTNESS = new Set(["pathorob", "plism"]);

// Robustness task IDs by benchmark
const ROBUSTNESS_TASK_IDS_BY_BENCHMARK: Record<string, string[]> = {
  pathorob: [
    "pathorob_tcga_2x2",
    "pathorob_camelyon",
    "pathorob_tolkach_esca",
  ],
  plism: [
    "plism_cosine_similarity",
    "plism_cross_scanner",
    "plism_cross_staining",
    "plism_cross_both",
  ],
};

// All available performance benchmarks (excluding robustness benchmarks)
export const ALL_PERFORMANCE_BENCHMARKS = [
  { id: "eva", label: "EVA" },
  { id: "pathbench", label: "PathBench" },
  { id: "stanford", label: "Stanford" },
  { id: "hest", label: "HEST" },
  { id: "pathobench", label: "Patho-Bench" },
  { id: "sinai", label: "Sinai" },
  { id: "stamp", label: "STAMP" },
  { id: "thunder", label: "THUNDER" },
];

// Default selected benchmarks
export const DEFAULT_SELECTED_BENCHMARKS = new Set(["eva", "hest", "thunder"]);

// Get robustness score (avg of selected robustness benchmark tasks)
export function getRobustnessScore(
  modelId: string,
  results: Result[],
  selectedRobustness: Set<string>
): number | null {
  // Build list of task IDs from selected robustness benchmarks
  const taskIds: string[] = [];
  for (const benchmarkId of selectedRobustness) {
    const ids = ROBUSTNESS_TASK_IDS_BY_BENCHMARK[benchmarkId];
    if (ids) taskIds.push(...ids);
  }

  if (taskIds.length === 0) return null;

  const robustnessResults = results.filter(
    (r) => r.modelId === modelId && taskIds.includes(r.taskId)
  );

  if (robustnessResults.length === 0) {
    return null;
  }

  const sum = robustnessResults.reduce((acc, r) => acc + r.value, 0);
  return sum / robustnessResults.length;
}

// Get performance stats for normalization
function getBenchmarkStats(
  benchmarkId: string,
  results: Result[],
  tasks: Task[]
): { min: number; max: number } | null {
  const benchmarkTaskIds = tasks
    .filter((t) => t.benchmarkId === benchmarkId)
    .map((t) => t.id);

  const values = results
    .filter((r) => benchmarkTaskIds.includes(r.taskId))
    .map((r) => r.value);

  if (values.length === 0) return null;

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// Get average performance for a model on a benchmark
function getModelBenchmarkPerformance(
  modelId: string,
  benchmarkId: string,
  results: Result[],
  tasks: Task[]
): number | null {
  const benchmarkTaskIds = tasks
    .filter((t) => t.benchmarkId === benchmarkId)
    .map((t) => t.id);

  const modelResults = results.filter(
    (r) => r.modelId === modelId && benchmarkTaskIds.includes(r.taskId)
  );

  if (modelResults.length === 0) return null;

  const sum = modelResults.reduce((acc, r) => acc + r.value, 0);
  return sum / modelResults.length;
}

// Build scatter data points (one per model, averaged across selected benchmarks)
export function buildScalingLawsData(
  models: Model[],
  tasks: Task[],
  results: Result[],
  selectedBenchmarks: Set<string>,
  selectedRobustness: Set<string>
): ScalingLawsDataPoint[] {
  const dataPoints: ScalingLawsDataPoint[] = [];
  const benchmarkIds = Array.from(selectedBenchmarks);

  if (benchmarkIds.length === 0 || selectedRobustness.size === 0) return dataPoints;

  // Precompute benchmark stats for normalization
  const benchmarkStats: Record<string, { min: number; max: number }> = {};
  for (const benchmarkId of benchmarkIds) {
    const stats = getBenchmarkStats(benchmarkId, results, tasks);
    if (stats) {
      benchmarkStats[benchmarkId] = stats;
    }
  }

  // Process each model
  for (const model of models) {
    // Check if model has robustness data
    const robustness = getRobustnessScore(model.id, results, selectedRobustness);
    if (robustness === null) continue;

    const params = parseModelParams(model.params);

    // Collect normalized performance across all selected benchmarks
    const normalizedPerformances: number[] = [];

    for (const benchmarkId of benchmarkIds) {
      const stats = benchmarkStats[benchmarkId];
      if (!stats) continue;

      const rawPerformance = getModelBenchmarkPerformance(
        model.id,
        benchmarkId,
        results,
        tasks
      );
      if (rawPerformance === null) continue;

      // Normalize performance to [0, 1]
      let normalizedPerformance: number;
      if (stats.max === stats.min) {
        normalizedPerformance = 0.5;
      } else {
        normalizedPerformance =
          (rawPerformance - stats.min) / (stats.max - stats.min);
      }

      // THUNDER uses rank sum (lower is better), so invert
      if (benchmarkId === "thunder") {
        normalizedPerformance = 1 - normalizedPerformance;
      }

      normalizedPerformances.push(normalizedPerformance);
    }

    // Only add if we have performance data for ALL selected benchmarks
    if (normalizedPerformances.length !== benchmarkIds.length) continue;

    // Average performance across benchmarks
    const avgPerformance =
      normalizedPerformances.reduce((a, b) => a + b, 0) /
      normalizedPerformances.length;

    dataPoints.push({
      modelId: model.id,
      modelName: model.name,
      organization: model.organization,
      robustness,
      performance: avgPerformance,
      params,
      benchmarkCount: normalizedPerformances.length,
    });
  }

  return dataPoints;
}

