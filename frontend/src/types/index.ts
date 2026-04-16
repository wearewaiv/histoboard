/**
 * Core TypeScript Type Definitions for Histoboard
 *
 * This module defines the "shape" of data used throughout the application.
 * TypeScript types act like contracts - they describe what properties an
 * object must have and what values are allowed.
 *
 * ## What is a Type?
 *
 * In TypeScript, a type describes the structure of data. For example:
 *
 * ```typescript
 * // This says "a Model must have an id (string) and name (string)"
 * interface Model {
 *   id: string;
 *   name: string;
 * }
 *
 * // Now TypeScript enforces this:
 * const myModel: Model = { id: "abc", name: "Test" }; // ✓ Valid
 * const badModel: Model = { id: 123 };                // ✗ Error: id must be string
 * ```
 *
 * ## Data Hierarchy
 *
 * The main entities in Histoboard form a hierarchy:
 *
 * ```
 * Model                  Benchmark
 *   │                        │
 *   │                        ├── Task 1
 *   │                        ├── Task 2
 *   │                        └── Task 3
 *   │                             │
 *   └─────────── Result ─────────┘
 *
 * - Model: A machine learning model (e.g., "UNI", "Virchow2")
 * - Benchmark: A test suite (e.g., "EVA", "PathBench")
 * - Task: A specific test within a benchmark (e.g., "BACH breast classification")
 * - Result: How well a specific Model performed on a specific Task
 * ```
 *
 * ## Key Types in This File
 *
 * 1. **Model** - Information about an ML model (name, size, license, etc.)
 * 2. **Benchmark** - A collection of evaluation tasks
 * 3. **Task** - A single evaluation test (dataset + metric)
 * 4. **Result** - A model's score on a task
 * 5. **ModelRanking** - Aggregated ranking across multiple tasks
 *
 * ## How Types are Used
 *
 * ```typescript
 * // Types are used when defining component props
 * interface TableProps {
 *   models: Model[];      // Array of Model objects
 *   results: Result[];    // Array of Result objects
 * }
 *
 * // Types are used when fetching data
 * const models: Model[] = await fetch('/data/models.json').then(r => r.json());
 *
 * // Types enable autocomplete in your editor
 * models[0].name     // TypeScript knows this is a string
 * models[0].params   // TypeScript knows this is a string like "307M"
 * ```
 *
 * @module types
 */

// =============================================================================
// Enumeration Types
// =============================================================================

/**
 * License types for foundation models.
 * - open-source: Freely available for any use
 * - non-commercial: Restricted to non-commercial applications
 * - closed-source: Proprietary, not publicly available
 */
export type LicenseType = "open-source" | "non-commercial" | "closed-source";

/**
 * Publication status of the model's research paper.
 * - peer-reviewed: Published in a peer-reviewed venue
 * - preprint: Available as preprint (e.g., arXiv)
 * - blog: Announced via blog post only
 */
export type PublicationType = "peer-reviewed" | "preprint" | "blog";

/**
 * Model architecture type.
 * - vision: Vision-only encoder (e.g., ViT, ResNet)
 * - vision-language: Multimodal model with text capabilities
 */
export type ModelType = "vision" | "vision-language";

/**
 * Benchmark categories for grouping and filtering.
 * These represent different evaluation axes:
 * - Modality: pathology, radiology
 * - Granularity: patch-level, slide-level
 * - Task type: survival, segmentation, retrieval
 * - Quality: robustness, calibration
 * - Stain type: H&E
 * - Special: spatial-transcriptomics
 */
export type BenchmarkCategory =
  | "pathology"
  | "radiology"
  | "spatial-transcriptomics"
  | "patch-level"
  | "slide-level"
  | "survival"
  | "segmentation"
  | "retrieval"
  | "robustness"
  | "calibration"
  | "H&E";

/**
 * Metric types used in benchmark evaluations.
 * Each metric measures a different aspect of model performance:
 * - accuracy: Classification accuracy
 * - auc: Area Under ROC Curve (AUROC)
 * - f1: F1 score (harmonic mean of precision and recall)
 * - c-index: Concordance index for survival analysis
 * - dice: Dice coefficient for segmentation
 * - map: Mean Average Precision for retrieval
 */
export type MetricType = "accuracy" | "auc" | "f1" | "c-index" | "dice" | "map";

/**
 * Methods for aggregating ranks across multiple tasks.
 * - mean: Arithmetic mean of ranks
 * - median: Median rank (robust to outliers)
 * - borda: Borda count (sum of n - rank + 1)
 */
export type RankingMethod = "mean" | "median" | "borda";

/**
 * Strategies for handling tied values when assigning ranks.
 * - average: Tied values receive the average of their ranks
 * - min: Tied values receive the minimum (best) rank
 * - max: Tied values receive the maximum (worst) rank
 */
export type TieBreakingStrategy = "average" | "min" | "max";

// =============================================================================
// Core Data Types
// =============================================================================

/**
 * Represents a foundation model in the benchmark.
 * Contains metadata about the model's architecture, training, and availability.
 */
export interface Model {
  /** Unique identifier (e.g., "mahmood_uni", "paige_virchow2") */
  id: string;
  /** Display name of the model */
  name: string;
  /** Organization that developed the model */
  organization: string;
  /** Model architecture (e.g., "ViT-L/16", "ViT-H/14") */
  architecture: string;
  /** Number of parameters (e.g., "307M", "1.1B") */
  params: string;
  /** Description of pretraining data */
  pretrainingData: string;
  /** Publication or release date (ISO format) */
  publicationDate: string;
  /** License type for model usage */
  license?: LicenseType;
  /** Publication status of associated paper */
  publicationType?: PublicationType;
  /** Whether model has text capabilities */
  modelType?: ModelType;
  /** Training methodology (e.g., "DINO", "CLIP", "MAE") */
  trainingMethod?: string;
  /** URL to the research paper */
  paperUrl?: string;
  /** URL to blog post or announcement */
  blogUrl?: string;
  /** URL to source code repository */
  codeUrl?: string;
  /** URL to download model weights */
  weightsUrl?: string;
  /** URL to pretraining dataset information */
  datasetUrl?: string;
}

/**
 * Represents a benchmark suite containing multiple evaluation tasks.
 * Each benchmark is typically associated with a research publication.
 */
export interface Benchmark {
  /** Unique identifier (e.g., "eva", "pathbench") */
  id: string;
  /** Full display name */
  name: string;
  /** Abbreviated name for compact display */
  shortName: string;
  /** Category or categories this benchmark belongs to */
  category: BenchmarkCategory | BenchmarkCategory[];
  /** Primary URL (paper or project page) */
  url: string;
  /** GitHub repository URL if available */
  githubUrl?: string;
  /** List of organs/tissue types covered */
  organs: string[];
  /** Total number of evaluation tasks */
  taskCount: number;
  /** Brief description of the benchmark's purpose */
  description: string;
  /** URL to the research paper */
  paperUrl?: string;
  /** URL to associated dataset */
  datasetUrl?: string;
  /** URL to the source data (CSV, JSON, etc.) used for results */
  resultsUrl?: string;
}

/**
 * Represents a single evaluation task within a benchmark.
 * Each task evaluates models on a specific dataset with a specific metric.
 */
export interface Task {
  /** Unique identifier (e.g., "eva_bach", "pathbench_brca_os") */
  id: string;
  /** ID of the parent benchmark */
  benchmarkId: string;
  /** Display name of the task */
  name: string;
  /** Organ or tissue type being evaluated */
  organ: string;
  /** Primary evaluation metric */
  metric: MetricType;
  /** Task category for filtering */
  category: BenchmarkCategory | string;
  /** Associated dataset name if applicable */
  dataset?: string;
}

/**
 * Represents a model's performance on a specific task.
 * This is the core data unit for comparisons and rankings.
 */
export interface Result {
  /** ID of the evaluated model */
  modelId: string;
  /** ID of the evaluation task */
  taskId: string;
  /** Metric value (interpretation depends on metric type) */
  value: number;
  /** Rank among all models on this task (1 = best) */
  rank: number;
  /** Data source identifier (e.g., benchmark name) */
  source: string;
  /** When the result was collected (ISO format) */
  retrievedAt: string;
  /** Lower bound of the confidence interval (optional) */
  ciLower?: number;
  /** Upper bound of the confidence interval (optional) */
  ciUpper?: number;
}

// =============================================================================
// Computed/Derived Types
// =============================================================================

/**
 * Aggregated ranking information for a model across multiple tasks.
 * Used for displaying leaderboards and comparisons.
 */
export interface ModelRanking {
  /** ID of the ranked model */
  modelId: string;
  /** Display name of the model */
  modelName: string;
  /** Overall rank among all models (1 = best) */
  overallRank: number;
  /** Mean of per-task ranks */
  meanRank: number;
  /** Median of per-task ranks */
  medianRank: number;
  /** Number of tasks with results for this model */
  tasksEvaluated: number;
  /** Mean rank within each benchmark category */
  ranksByCategory: Record<BenchmarkCategory, number | null>;
  /** Mean rank within each organ/tissue type */
  ranksByOrgan: Record<string, number | null>;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * State for filtering results in the UI.
 * All arrays are treated as "any of" (OR) filters.
 */
export interface FilterState {
  /** Selected benchmark categories to include */
  categories: BenchmarkCategory[];
  /** Selected organs to include */
  organs: string[];
  /** Selected benchmark IDs to include */
  benchmarks: string[];
  /** Minimum number of tasks a model must have results for */
  minTasks: number;
}

/**
 * Configuration for how rankings are computed.
 */
export interface RankingConfig {
  /** Method for aggregating ranks across tasks */
  method: RankingMethod;
  /** How to handle tied values when assigning ranks */
  tieBreaking: TieBreakingStrategy;
}
