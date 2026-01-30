// Core TypeScript types for Histoboard

export type LicenseType = "open-source" | "non-commercial" | "closed-source";
export type PublicationType = "peer-reviewed" | "preprint" | "blog";
export type ModelType = "vision" | "vision-language";

export interface Model {
  id: string;
  name: string;
  organization: string;
  architecture: string;
  params: string;
  pretrainingData: string;
  publicationDate: string;
  license?: LicenseType;
  publicationType?: PublicationType;
  modelType?: ModelType;
  paperUrl?: string;
  blogUrl?: string;
  codeUrl?: string;
  weightsUrl?: string;
  datasetUrl?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  shortName: string;
  category: BenchmarkCategory;
  url: string;
  organs: string[];
  taskCount: number;
  description: string;
}

export type BenchmarkCategory =
  | "patch-level"
  | "slide-level"
  | "survival"
  | "segmentation"
  | "retrieval"
  | "robustness";

export interface Task {
  id: string;
  benchmarkId: string;
  name: string;
  organ: string;
  metric: MetricType;
  category: BenchmarkCategory;
}

export type MetricType = "accuracy" | "auc" | "f1" | "c-index" | "dice" | "map";

export interface Result {
  modelId: string;
  taskId: string;
  value: number;
  rank: number;
  source: string;
  retrievedAt: string;
}

export interface ModelRanking {
  modelId: string;
  modelName: string;
  overallRank: number;
  meanRank: number;
  medianRank: number;
  tasksEvaluated: number;
  ranksByCategory: Record<BenchmarkCategory, number | null>;
  ranksByOrgan: Record<string, number | null>;
}

export interface FilterState {
  categories: BenchmarkCategory[];
  organs: string[];
  benchmarks: string[];
  minTasks: number;
}

export interface RankingConfig {
  method: "mean" | "median" | "borda";
  tieBreaking: "average" | "min" | "max";
}
