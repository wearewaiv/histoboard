import type {
  Result,
  ModelRanking,
  Task,
  Model,
  FilterState,
  RankingConfig,
  BenchmarkCategory,
} from "@/types";

/**
 * Compute ranks for a single task
 * Higher values are better (rank 1 = best)
 */
export function computeTaskRanks(
  results: Result[],
  tieBreaking: "average" | "min" | "max" = "average"
): Map<string, number> {
  const sorted = [...results].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();

  let currentRank = 1;
  let i = 0;

  while (i < sorted.length) {
    const currentValue = sorted[i].value;
    const tiedResults: Result[] = [];

    while (i < sorted.length && sorted[i].value === currentValue) {
      tiedResults.push(sorted[i]);
      i++;
    }

    let assignedRank: number;
    if (tieBreaking === "average") {
      assignedRank =
        currentRank + (tiedResults.length - 1) / 2;
    } else if (tieBreaking === "min") {
      assignedRank = currentRank;
    } else {
      assignedRank = currentRank + tiedResults.length - 1;
    }

    for (const result of tiedResults) {
      ranks.set(result.modelId, assignedRank);
    }

    currentRank += tiedResults.length;
  }

  return ranks;
}

/**
 * Aggregate ranks across multiple tasks
 */
export function aggregateRanks(
  ranksByTask: Map<string, Map<string, number>>,
  method: "mean" | "median" | "borda" = "mean"
): Map<string, number> {
  const modelRanks = new Map<string, number[]>();

  for (const taskRanks of ranksByTask.values()) {
    for (const [modelId, rank] of taskRanks) {
      if (!modelRanks.has(modelId)) {
        modelRanks.set(modelId, []);
      }
      modelRanks.get(modelId)!.push(rank);
    }
  }

  const aggregated = new Map<string, number>();

  for (const [modelId, ranks] of modelRanks) {
    let score: number;

    if (method === "mean") {
      score = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    } else if (method === "median") {
      const sorted = [...ranks].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      score =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      // Borda count: sum of (n - rank + 1) for each task
      const n = Math.max(...ranks);
      score = ranks.reduce((sum, r) => sum + (n - r + 1), 0);
    }

    aggregated.set(modelId, score);
  }

  return aggregated;
}

/**
 * Filter results based on filter state
 */
export function filterResults(
  results: Result[],
  tasks: Task[],
  filters: FilterState
): Result[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return results.filter((r) => {
    const task = taskMap.get(r.taskId);
    if (!task) return false;

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(task.category as BenchmarkCategory)
    ) {
      return false;
    }

    if (filters.organs.length > 0 && !filters.organs.includes(task.organ)) {
      return false;
    }

    if (
      filters.benchmarks.length > 0 &&
      !filters.benchmarks.includes(task.benchmarkId)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Compute full model rankings with breakdowns
 */
export function computeModelRankings(
  models: Model[],
  tasks: Task[],
  results: Result[],
  config: RankingConfig = { method: "mean", tieBreaking: "average" }
): ModelRanking[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const modelMap = new Map(models.map((m) => [m.id, m]));

  // Group results by task
  const resultsByTask = new Map<string, Result[]>();
  for (const result of results) {
    if (!resultsByTask.has(result.taskId)) {
      resultsByTask.set(result.taskId, []);
    }
    resultsByTask.get(result.taskId)!.push(result);
  }

  // Compute ranks for each task
  const ranksByTask = new Map<string, Map<string, number>>();
  for (const [taskId, taskResults] of resultsByTask) {
    ranksByTask.set(taskId, computeTaskRanks(taskResults, config.tieBreaking));
  }

  // Aggregate overall ranks
  const overallScores = aggregateRanks(ranksByTask, config.method);

  // Get unique categories and organs
  const categories = [...new Set(tasks.map((t) => t.category))];
  const organs = [...new Set(tasks.map((t) => t.organ))];

  // Compute rankings per model
  const rankings: ModelRanking[] = [];

  for (const model of models) {
    const modelResults = results.filter((r) => r.modelId === model.id);
    if (modelResults.length === 0) continue;

    const modelRanksArray: number[] = [];
    for (const [taskId, taskRanks] of ranksByTask) {
      const rank = taskRanks.get(model.id);
      if (rank !== undefined) {
        modelRanksArray.push(rank);
      }
    }

    // Compute category breakdowns
    const ranksByCategory: Record<BenchmarkCategory, number | null> = {} as Record<BenchmarkCategory, number | null>;
    for (const category of categories) {
      const categoryTasks = tasks.filter((t) => t.category === category);
      const categoryTaskIds = new Set(categoryTasks.map((t) => t.id));
      const categoryRanks: number[] = [];

      for (const [taskId, taskRanks] of ranksByTask) {
        if (categoryTaskIds.has(taskId)) {
          const rank = taskRanks.get(model.id);
          if (rank !== undefined) {
            categoryRanks.push(rank);
          }
        }
      }

      ranksByCategory[category as BenchmarkCategory] =
        categoryRanks.length > 0
          ? categoryRanks.reduce((a, b) => a + b, 0) / categoryRanks.length
          : null;
    }

    // Compute organ breakdowns
    const ranksByOrgan: Record<string, number | null> = {};
    for (const organ of organs) {
      const organTasks = tasks.filter((t) => t.organ === organ);
      const organTaskIds = new Set(organTasks.map((t) => t.id));
      const organRanks: number[] = [];

      for (const [taskId, taskRanks] of ranksByTask) {
        if (organTaskIds.has(taskId)) {
          const rank = taskRanks.get(model.id);
          if (rank !== undefined) {
            organRanks.push(rank);
          }
        }
      }

      ranksByOrgan[organ] =
        organRanks.length > 0
          ? organRanks.reduce((a, b) => a + b, 0) / organRanks.length
          : null;
    }

    const sortedRanks = [...modelRanksArray].sort((a, b) => a - b);
    const mid = Math.floor(sortedRanks.length / 2);

    rankings.push({
      modelId: model.id,
      modelName: model.name,
      overallRank: 0, // Will be set after sorting
      meanRank: overallScores.get(model.id) || 0,
      medianRank:
        sortedRanks.length % 2 !== 0
          ? sortedRanks[mid]
          : (sortedRanks[mid - 1] + sortedRanks[mid]) / 2,
      tasksEvaluated: modelRanksArray.length,
      ranksByCategory,
      ranksByOrgan,
    });
  }

  // Sort by mean rank and assign overall ranks
  rankings.sort((a, b) => a.meanRank - b.meanRank);
  rankings.forEach((r, i) => {
    r.overallRank = i + 1;
  });

  return rankings;
}
