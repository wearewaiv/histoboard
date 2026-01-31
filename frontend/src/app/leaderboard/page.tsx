"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { DetailedResultsTable } from "@/components/tables/DetailedResultsTable";
import { PathBenchDetailedTable } from "@/components/tables/PathBenchDetailedTable";
import { StanfordDetailedTable } from "@/components/tables/StanfordDetailedTable";
import { HESTDetailedTable } from "@/components/tables/HESTDetailedTable";
import { PathoBenchDetailedTable } from "@/components/tables/PathoBenchDetailedTable";
import { SinaiDetailedTable } from "@/components/tables/SinaiDetailedTable";
import { STAMPDetailedTable } from "@/components/tables/STAMPDetailedTable";
import { THUNDERDetailedTable } from "@/components/tables/THUNDERDetailedTable";
import { PathoROBDetailedTable } from "@/components/tables/PathoROBDetailedTable";
import { PLISMDetailedTable } from "@/components/tables/PLISMDetailedTable";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";

import type { Model, Task, Result, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

// Helper to parse size strings like "632M", "1.3B", "307M" to numeric values (in millions)
function parseParamSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|M|K)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "B") return num * 1000;
  if (unit === "K") return num / 1000;
  return num; // M or no unit
}

// Model size categories
const SIZE_CATEGORIES = [
  { id: "below-50", label: "< 50M", min: 0, max: 50 },
  { id: "50-100", label: "50M - 100M", min: 50, max: 100 },
  { id: "100-500", label: "100M - 500M", min: 100, max: 500 },
  { id: "500-1000", label: "500M - 1B", min: 500, max: 1000 },
  { id: "above-1000", label: "> 1B", min: 1000, max: Infinity },
] as const;

// Get size category for a given params string
function getSizeCategory(params: string): string {
  const sizeInM = parseParamSize(params);
  for (const cat of SIZE_CATEGORIES) {
    if (sizeInM >= cat.min && sizeInM < cat.max) {
      return cat.id;
    }
  }
  return SIZE_CATEGORIES[SIZE_CATEGORIES.length - 1].id;
}

// Helper to parse pretraining data size strings like "3M+ WSIs", "100K+ WSIs" to numeric (in thousands)
function parseDataSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(M|K)?\+?\s*/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "M") return num * 1000;
  return num; // K or no unit
}

// Check if pretraining data mentions WSIs
function isWSIData(data: string): boolean {
  return data.toLowerCase().includes("wsi");
}

// Check if pretraining data mentions image-caption/text pairs
function isImageCaptionData(data: string): boolean {
  const lower = data.toLowerCase();
  return (
    lower.includes("image-caption") ||
    lower.includes("image-text") ||
    lower.includes("caption group")
  );
}

// Check if pretraining data mentions histology patches (like "50M+ images")
function isHistologyPatchData(data: string): boolean {
  const lower = data.toLowerCase();
  // "50M+ images" is histology patches, not image-caption pairs
  return lower.includes("images") && !isImageCaptionData(data);
}

// Pretraining data size categories (for WSI data, in thousands)
const DATA_SIZE_CATEGORIES = [
  { id: "below-10k", label: "< 10K WSIs", min: 0, max: 10 },
  { id: "10k-50k", label: "10K - 50K WSIs", min: 10, max: 50 },
  { id: "50k-100k", label: "50K - 100K WSIs", min: 50, max: 100 },
  { id: "100k-500k", label: "100K - 500K WSIs", min: 100, max: 500 },
  { id: "500k-1m", label: "500K - 1M WSIs", min: 500, max: 1000 },
  { id: "1m-2m", label: "1M - 2M WSIs", min: 1000, max: 2000 },
  { id: "2m-3m", label: "2M - 3M WSIs", min: 2000, max: 3000 },
  { id: "above-3m", label: "> 3M WSIs", min: 3000, max: Infinity },
] as const;

// Image-caption pair categories (in thousands)
const IMAGE_CAPTION_CATEGORIES = [
  { id: "ic-below-1m", label: "< 1M image-caption pairs", min: 0, max: 1000 },
  { id: "ic-1m-2m", label: "1M - 2M image-caption pairs", min: 1000, max: 2000 },
  { id: "ic-above-2m", label: "> 2M image-caption pairs", min: 2000, max: Infinity },
] as const;

// Special category for histology patches
const HISTOLOGY_PATCH_CATEGORY = { id: "histology-patches", label: "50M+ histology patches" };

// Get data size category for a given pretrainingData string
function getDataSizeCategory(data: string): string | null {
  if (isWSIData(data)) {
    const sizeInK = parseDataSize(data);
    for (const cat of DATA_SIZE_CATEGORIES) {
      if (sizeInK >= cat.min && sizeInK < cat.max) {
        return cat.id;
      }
    }
    return DATA_SIZE_CATEGORIES[DATA_SIZE_CATEGORIES.length - 1].id;
  }

  if (isImageCaptionData(data)) {
    const sizeInK = parseDataSize(data);
    for (const cat of IMAGE_CAPTION_CATEGORIES) {
      if (sizeInK >= cat.min && sizeInK < cat.max) {
        return cat.id;
      }
    }
    return IMAGE_CAPTION_CATEGORIES[IMAGE_CAPTION_CATEGORIES.length - 1].id;
  }

  if (isHistologyPatchData(data)) {
    return HISTOLOGY_PATCH_CATEGORY.id;
  }

  return null; // Other non-categorized data
}

// Training methods that are considered VLM-style (same as timeline page)
const VLM_TRAINING_METHODS = [
  "CLIP",
  "CoCa, iBOT",
  "CoCa, BEiT-3",
  "iBOT, CoCa",
  "Contrastive (custom)",
];

// Check if a model is a VLM
function isVLMModel(model: Model): boolean {
  return (
    model.modelType === "vision-language" ||
    VLM_TRAINING_METHODS.includes(model.trainingMethod || "")
  );
}

// Get training method category (VLM or specific method)
function getTrainingMethodCategory(model: Model): string {
  if (isVLMModel(model)) {
    return "VLM";
  }
  return model.trainingMethod || "Unknown";
}

export default function LeaderboardPage() {
  const [filterExpanded, setFilterExpanded] = useState(true);

  // Get all models that have rankings
  const rankedModels = useMemo(() => {
    return models.filter((m) => benchmarks.some((b) => rankings[b.id]?.[m.id]));
  }, []);

  // Get all model IDs that have rankings
  const allModelIds = useMemo(() => rankedModels.map((m) => m.id), [rankedModels]);

  // Extract unique filter values from ranked models
  const filterOptions = useMemo(() => {
    const sizeCategories = new Set<string>();
    const wsiDataSizeCategories = new Set<string>();
    const imageCaptionCategories = new Set<string>();
    const hasHistologyPatches = { value: false };
    const methodCategories = new Set<string>();

    rankedModels.forEach((m) => {
      if (m.params) sizeCategories.add(getSizeCategory(m.params));
      if (m.pretrainingData) {
        const cat = getDataSizeCategory(m.pretrainingData);
        if (cat) {
          // Check which type of category it is
          if (cat.startsWith("ic-")) {
            imageCaptionCategories.add(cat);
          } else if (cat === HISTOLOGY_PATCH_CATEGORY.id) {
            hasHistologyPatches.value = true;
          } else {
            wsiDataSizeCategories.add(cat);
          }
        }
      }
      methodCategories.add(getTrainingMethodCategory(m));
    });

    // Return size categories in order, only those that have models
    const orderedSizeCategories = SIZE_CATEGORIES
      .filter((cat) => sizeCategories.has(cat.id))
      .map((cat) => cat.id);

    // Return WSI data size categories in order, only those that have models
    const orderedWsiDataSizeCategories = DATA_SIZE_CATEGORIES
      .filter((cat) => wsiDataSizeCategories.has(cat.id))
      .map((cat) => cat.id);

    // Return image-caption categories in order, only those that have models
    const orderedImageCaptionCategories = IMAGE_CAPTION_CATEGORIES
      .filter((cat) => imageCaptionCategories.has(cat.id))
      .map((cat) => cat.id);

    // Put VLM first, then sort the rest alphabetically
    const sortedMethodCategories = [...methodCategories].sort((a, b) => {
      if (a === "VLM") return -1;
      if (b === "VLM") return 1;
      return a.localeCompare(b);
    });

    return {
      sizeCategories: orderedSizeCategories,
      wsiDataSizeCategories: orderedWsiDataSizeCategories,
      imageCaptionCategories: orderedImageCaptionCategories,
      hasHistologyPatches: hasHistologyPatches.value,
      methodCategories: sortedMethodCategories,
    };
  }, [rankedModels]);

  // Filter states (default: all selected)
  const [selectedSizeCategories, setSelectedSizeCategories] = useState<Set<string>>(
    () => new Set(filterOptions.sizeCategories)
  );
  const [selectedWsiDataSizeCategories, setSelectedWsiDataSizeCategories] = useState<Set<string>>(
    () => new Set(filterOptions.wsiDataSizeCategories)
  );
  const [selectedImageCaptionCategories, setSelectedImageCaptionCategories] = useState<Set<string>>(
    () => new Set(filterOptions.imageCaptionCategories)
  );
  const [selectedHistologyPatches, setSelectedHistologyPatches] = useState<boolean>(
    () => filterOptions.hasHistologyPatches
  );
  const [selectedMethodCategories, setSelectedMethodCategories] = useState<Set<string>>(
    () => new Set(filterOptions.methodCategories)
  );

  // Selected models based on attribute filters
  const filteredByAttributes = useMemo(() => {
    return rankedModels.filter((m) => {
      const sizeMatch = !m.params || selectedSizeCategories.has(getSizeCategory(m.params));

      // Data match: check which category type the data belongs to
      let dataMatch = true;
      if (m.pretrainingData) {
        const dataCat = getDataSizeCategory(m.pretrainingData);
        if (dataCat) {
          if (dataCat.startsWith("ic-")) {
            // Image-caption category
            dataMatch = selectedImageCaptionCategories.has(dataCat);
          } else if (dataCat === HISTOLOGY_PATCH_CATEGORY.id) {
            // Histology patches
            dataMatch = selectedHistologyPatches;
          } else {
            // WSI category
            dataMatch = selectedWsiDataSizeCategories.has(dataCat);
          }
        }
      }

      const methodMatch = selectedMethodCategories.has(getTrainingMethodCategory(m));
      return sizeMatch && dataMatch && methodMatch;
    });
  }, [rankedModels, selectedSizeCategories, selectedWsiDataSizeCategories, selectedImageCaptionCategories, selectedHistologyPatches, selectedMethodCategories]);

  // Model IDs after attribute filtering
  const filteredModelIds = useMemo(
    () => new Set(filteredByAttributes.map((m) => m.id)),
    [filteredByAttributes]
  );

  // Selected models (default: all that pass attribute filters)
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(
    () => new Set(allModelIds)
  );

  // Effective selected models = intersection of manual selection and attribute filters
  const effectiveSelectedIds = useMemo(() => {
    return new Set([...selectedModelIds].filter((id) => filteredModelIds.has(id)));
  }, [selectedModelIds, filteredModelIds]);

  // Collect per-benchmark average ranks for each model
  const modelRankings = useMemo(() => {
    const rankingsList: { modelId: string; eva?: number; pathbench?: number; stanford?: number; hest?: number; pathobench?: number; sinai?: number; stamp?: number; thunder?: number; pathorob?: number; plism?: number; benchmarkCount: number }[] = [];

    for (const model of models) {
      const evaRank = rankings.eva?.[model.id]?.avgRank;
      const pathbenchRank = rankings.pathbench?.[model.id]?.avgRank;
      const stanfordRank = rankings.stanford?.[model.id]?.avgRank;
      const hestRank = rankings.hest?.[model.id]?.avgRank;
      const pathobenchRank = rankings.pathobench?.[model.id]?.avgRank;
      const sinaiRank = rankings.sinai?.[model.id]?.avgRank;
      const stampRank = rankings.stamp?.[model.id]?.avgRank;
      const thunderRank = rankings.thunder?.[model.id]?.avgRank;
      const pathorobRank = rankings.pathorob?.[model.id]?.avgRank;
      const plismRank = rankings.plism?.[model.id]?.avgRank;

      const benchmarkCount =
        (evaRank !== undefined ? 1 : 0) +
        (pathbenchRank !== undefined ? 1 : 0) +
        (stanfordRank !== undefined ? 1 : 0) +
        (hestRank !== undefined ? 1 : 0) +
        (pathobenchRank !== undefined ? 1 : 0) +
        (sinaiRank !== undefined ? 1 : 0) +
        (stampRank !== undefined ? 1 : 0) +
        (thunderRank !== undefined ? 1 : 0) +
        (pathorobRank !== undefined ? 1 : 0) +
        (plismRank !== undefined ? 1 : 0);

      if (benchmarkCount > 0) {
        rankingsList.push({
          modelId: model.id,
          eva: evaRank,
          pathbench: pathbenchRank,
          stanford: stanfordRank,
          hest: hestRank,
          pathobench: pathobenchRank,
          sinai: sinaiRank,
          stamp: stampRank,
          thunder: thunderRank,
          pathorob: pathorobRank,
          plism: plismRank,
          benchmarkCount,
        });
      }
    }

    return rankingsList;
  }, []);

  // Filter rankings based on effective selected models
  const filteredModelRankings = useMemo(() => {
    return modelRankings.filter((ranking) => effectiveSelectedIds.has(ranking.modelId));
  }, [modelRankings, effectiveSelectedIds]);

  // Toggle helpers for attribute filters
  const toggleFilter = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  // Toggle a single model
  const toggleModel = (modelId: string) => {
    toggleFilter(modelId, setSelectedModelIds);
  };

  // Select all models (that pass attribute filters)
  const selectAllModels = () => {
    setSelectedModelIds(new Set(allModelIds));
  };

  // Clear all models
  const clearAllModels = () => {
    setSelectedModelIds(new Set());
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedSizeCategories(new Set(filterOptions.sizeCategories));
    setSelectedWsiDataSizeCategories(new Set(filterOptions.wsiDataSizeCategories));
    setSelectedImageCaptionCategories(new Set(filterOptions.imageCaptionCategories));
    setSelectedHistologyPatches(filterOptions.hasHistologyPatches);
    setSelectedMethodCategories(new Set(filterOptions.methodCategories));
    setSelectedModelIds(new Set(allModelIds));
  };

  // Select/clear all for size categories
  const selectAllSizeCategories = () => {
    setSelectedSizeCategories(new Set(filterOptions.sizeCategories));
  };
  const clearAllSizeCategories = () => {
    setSelectedSizeCategories(new Set());
  };

  // Select/clear all for data size categories
  const selectAllDataSizeCategories = () => {
    setSelectedWsiDataSizeCategories(new Set(filterOptions.wsiDataSizeCategories));
    setSelectedImageCaptionCategories(new Set(filterOptions.imageCaptionCategories));
    setSelectedHistologyPatches(filterOptions.hasHistologyPatches);
  };
  const clearAllDataSizeCategories = () => {
    setSelectedWsiDataSizeCategories(new Set());
    setSelectedImageCaptionCategories(new Set());
    setSelectedHistologyPatches(false);
  };

  // Select/clear all for method categories
  const selectAllMethodCategories = () => {
    setSelectedMethodCategories(new Set(filterOptions.methodCategories));
  };
  const clearAllMethodCategories = () => {
    setSelectedMethodCategories(new Set());
  };

  // Helper to get category labels
  const getSizeCategoryLabel = (catId: string) => {
    return SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getWsiDataSizeCategoryLabel = (catId: string) => {
    return DATA_SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getImageCaptionCategoryLabel = (catId: string) => {
    return IMAGE_CAPTION_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  // Count total data categories for display
  const totalDataCategories =
    filterOptions.wsiDataSizeCategories.length +
    filterOptions.imageCaptionCategories.length +
    (filterOptions.hasHistologyPatches ? 1 : 0);

  const selectedDataCategoriesCount =
    selectedWsiDataSizeCategories.size +
    selectedImageCaptionCategories.size +
    (selectedHistologyPatches ? 1 : 0);

  // Get sorted models for display in filter (only those passing attribute filters)
  const sortedModels = useMemo(() => {
    return [...filteredByAttributes].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredByAttributes]);

  // Compute integer ranks per benchmark for detail tables
  const evaModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.eva !== undefined)
      .sort((a, b) => a.eva! - b.eva!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathbenchModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathbench !== undefined)
      .sort((a, b) => a.pathbench! - b.pathbench!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const stanfordModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.stanford !== undefined)
      .sort((a, b) => a.stanford! - b.stanford!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const hestModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.hest !== undefined)
      .sort((a, b) => a.hest! - b.hest!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathobenchModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathobench !== undefined)
      .sort((a, b) => a.pathobench! - b.pathobench!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const sinaiModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.sinai !== undefined)
      .sort((a, b) => a.sinai! - b.sinai!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const stampModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.stamp !== undefined)
      .sort((a, b) => a.stamp! - b.stamp!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const thunderModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.thunder !== undefined)
      .sort((a, b) => a.thunder! - b.thunder!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathorobModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathorob !== undefined)
      .sort((a, b) => a.pathorob! - b.pathorob!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const plismModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.plism !== undefined)
      .sort((a, b) => a.plism! - b.plism!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Compare pathology foundation models across benchmarks
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Model Rankings</CardTitle>
          <Link
            href="/benchmarks"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all benchmarks →
          </Link>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rankings">
            <TabsList className="flex-wrap">
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
              <TabsTrigger value="eva-details">EVA</TabsTrigger>
              <TabsTrigger value="pathbench-details">PathBench</TabsTrigger>
              <TabsTrigger value="stanford-details">Stanford</TabsTrigger>
              <TabsTrigger value="hest-details">HEST</TabsTrigger>
              <TabsTrigger value="pathobench-details">Patho-Bench</TabsTrigger>
              <TabsTrigger value="sinai-details">Sinai</TabsTrigger>
              <TabsTrigger value="stamp-details">STAMP</TabsTrigger>
              <TabsTrigger value="thunder-details">THUNDER</TabsTrigger>
              <TabsTrigger value="pathorob-details">PathoROB</TabsTrigger>
              <TabsTrigger value="plism-details">PLISM</TabsTrigger>
            </TabsList>

            <TabsContent value="rankings">
              <p className="mb-4 text-sm text-muted-foreground">
                Click column headers to sort. Rankings are taken directly from the official benchmarks and serve as the reference. For each benchmark and model, we also provide the average ranking across the corresponding tasks. &quot;-&quot; indicates the model was not evaluated on that benchmark.
              </p>

              {/* Filters */}
              <div className="mb-4 border rounded-lg">
                <button
                  onClick={() => setFilterExpanded(!filterExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Filters</span>
                    <span className="text-sm text-muted-foreground">
                      ({effectiveSelectedIds.size}/{allModelIds.length} models shown)
                    </span>
                  </div>
                  {filterExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {filterExpanded && (
                  <div className="px-4 pb-4 border-t">
                    {/* Reset button and dropdown filters */}
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      {/* Model Size Dropdown */}
                      <MultiSelectDropdown
                        label="Model Size"
                        options={filterOptions.sizeCategories.map((catId) => ({
                          id: catId,
                          label: getSizeCategoryLabel(catId),
                        }))}
                        selectedIds={selectedSizeCategories}
                        onToggle={(catId) => toggleFilter(catId, setSelectedSizeCategories)}
                        onSelectAll={selectAllSizeCategories}
                        onClearAll={clearAllSizeCategories}
                      />

                      {/* Training Method Dropdown */}
                      <MultiSelectDropdown
                        label="Training"
                        options={filterOptions.methodCategories.map((category) => ({
                          id: category,
                          label: category,
                        }))}
                        selectedIds={selectedMethodCategories}
                        onToggle={(category) => toggleFilter(category, setSelectedMethodCategories)}
                        onSelectAll={selectAllMethodCategories}
                        onClearAll={clearAllMethodCategories}
                      />

                      {/* Models Dropdown */}
                      <MultiSelectDropdown
                        label="Models"
                        options={sortedModels.map((model) => ({
                          id: model.id,
                          label: model.name,
                        }))}
                        selectedIds={selectedModelIds}
                        onToggle={toggleModel}
                        onSelectAll={selectAllModels}
                        onClearAll={clearAllModels}
                      />

                      <Button variant="outline" size="sm" onClick={resetAllFilters}>
                        Reset All
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <LeaderboardTable
                modelRankings={filteredModelRankings}
                models={models}
                benchmarks={benchmarks}
              />
            </TabsContent>

            <TabsContent value="eva-details">
              <DetailedResultsTable
                models={models.filter(m => rankings.eva?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "eva")}
                results={results.filter(r => r.source === "eva")}
                modelRankings={evaModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathbench-details">
              <PathBenchDetailedTable
                models={models.filter(m => rankings.pathbench?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathbench")}
                results={results.filter(r => r.source === "pathbench")}
                modelRankings={pathbenchModelRankings}
              />
            </TabsContent>

            <TabsContent value="stanford-details">
              <StanfordDetailedTable
                models={models.filter(m => rankings.stanford?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "stanford")}
                results={results.filter(r => r.source === "stanford") as any}
                modelRankings={stanfordModelRankings}
              />
            </TabsContent>

            <TabsContent value="hest-details">
              <HESTDetailedTable
                models={models.filter(m => rankings.hest?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "hest")}
                results={results.filter(r => r.source === "hest")}
                modelRankings={hestModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathobench-details">
              <PathoBenchDetailedTable
                models={models.filter(m => rankings.pathobench?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathobench")}
                results={results.filter(r => r.source === "pathobench")}
                modelRankings={pathobenchModelRankings}
              />
            </TabsContent>

            <TabsContent value="sinai-details">
              <SinaiDetailedTable
                models={models.filter(m => rankings.sinai?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "sinai")}
                results={results.filter(r => r.source === "sinai") as any}
                modelRankings={sinaiModelRankings}
              />
            </TabsContent>

            <TabsContent value="stamp-details">
              <STAMPDetailedTable
                models={models.filter(m => rankings.stamp?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "stamp")}
                results={results.filter(r => r.source === "stamp")}
                modelRankings={stampModelRankings}
              />
            </TabsContent>

            <TabsContent value="thunder-details">
              <THUNDERDetailedTable
                models={models.filter(m => rankings.thunder?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "thunder")}
                results={results.filter(r => r.source === "thunder")}
                modelRankings={thunderModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathorob-details">
              <PathoROBDetailedTable
                models={models.filter(m => rankings.pathorob?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathorob")}
                results={results.filter(r => r.source === "pathorob")}
                modelRankings={pathorobModelRankings}
              />
            </TabsContent>

            <TabsContent value="plism-details">
              <PLISMDetailedTable
                models={models.filter(m => rankings.plism?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "plism")}
                results={results.filter(r => r.source === "plism")}
                modelRankings={plismModelRankings}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
