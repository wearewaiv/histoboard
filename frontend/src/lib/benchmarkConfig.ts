/**
 * Benchmark Configuration and Ranking Utilities
 *
 * Shared benchmark metadata (id + shortName pairs) for display contexts
 * where the full Benchmark type from data/benchmarks.json is not needed,
 * plus medal icons and rank computation helpers.
 *
 * @module lib/benchmarkConfig
 */

// =============================================================================
// Types
// =============================================================================

/** Lightweight benchmark reference for ranking display. */
export interface BenchmarkRef {
  id: string;
  name: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Ordered list of benchmarks for ranking badges.
 * Kept separate from the full Benchmark data (benchmarks.json) because
 * these are used in static contexts where importing the full data
 * would be unnecessary.
 */
export const BENCHMARK_REFS: BenchmarkRef[] = [
  { id: "eva", name: "EVA" },
  { id: "pathbench", name: "PathBench" },
  { id: "stanford", name: "Stanford" },
  { id: "hest", name: "HEST" },
  { id: "pathobench", name: "Patho-Bench" },
  { id: "sinai", name: "Sinai" },
  { id: "stamp", name: "STAMP" },
  { id: "thunder", name: "THUNDER" },
  { id: "pathorob", name: "PathoROB" },
  { id: "plism", name: "Plismbench" },
];

// =============================================================================
// Medal Helper
// =============================================================================

/**
 * Get medal emoji for a rank, or null if rank > 3.
 *
 * @param rank - Integer rank (1-based)
 * @returns Medal emoji string or null
 */
export function getMedal(rank: number): string | null {
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return null;
}

// =============================================================================
// Rank Computation
// =============================================================================

/** Shape of the rankings data from rankings.json. */
type RankingsData = Record<
  string,
  Record<string, { avgRank: number; taskCount: number }>
>;

/** Result of computeBenchmarkRanks for a single benchmark. */
export interface BenchmarkRankData {
  ranks: Map<string, number>;
  total: number;
}

/**
 * Compute integer ranks per benchmark from rankings data.
 * For each benchmark, sorts models by avgRank and assigns 1-based integer ranks.
 *
 * @param rankings - Rankings data: benchmarkId -> modelId -> { avgRank, taskCount }
 * @returns Per-benchmark rank maps keyed by benchmark ID
 */
export function computeBenchmarkRanks(
  rankings: RankingsData
): Record<string, BenchmarkRankData> {
  const result: Record<string, BenchmarkRankData> = {};

  for (const benchmark of BENCHMARK_REFS) {
    const benchmarkData = rankings[benchmark.id];
    if (!benchmarkData) continue;

    const modelsWithRank = Object.entries(benchmarkData)
      .map(([modelId, data]) => ({ modelId, avgRank: data.avgRank }))
      .sort((a, b) => a.avgRank - b.avgRank);

    const rankMap = new Map<string, number>();
    modelsWithRank.forEach((item, index) => {
      rankMap.set(item.modelId, index + 1);
    });

    result[benchmark.id] = {
      ranks: rankMap,
      total: modelsWithRank.length,
    };
  }

  return result;
}
