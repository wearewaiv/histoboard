"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { ScalingLawsChart } from "@/components/charts/ScalingLawsChart";
import { ModelSizePerformanceChart } from "@/components/charts/ModelSizePerformanceChart";

import modelsData from "@/data/models.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";

import type { Model, Benchmark, Task, Result } from "@/types";

const models = modelsData as Model[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;
const tasks = tasksData as Task[];
const results = resultsData as Result[];

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
    const licenseCategories = new Set<string>();
    const publicationYears = new Set<string>();
    const publicationTypes = new Set<string>();
    const modelTypes = new Set<string>();

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
      if (m.license) licenseCategories.add(m.license);
      if (m.publicationDate) {
        const year = m.publicationDate.split("-")[0];
        publicationYears.add(year);
      }
      if (m.publicationType) publicationTypes.add(m.publicationType);
      modelTypes.add(isVLMModel(m) ? "VLM" : "VM");
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

    // Sort years descending (most recent first)
    const sortedYears = [...publicationYears].sort((a, b) => b.localeCompare(a));

    // Sort licenses in a logical order
    const licenseOrder = ["open-source", "non-commercial", "closed-source"];
    const sortedLicenses = [...licenseCategories].sort(
      (a, b) => licenseOrder.indexOf(a) - licenseOrder.indexOf(b)
    );

    // Sort model types (VM first, then VLM)
    const sortedModelTypes = [...modelTypes].sort((a, b) => {
      if (a === "VM") return -1;
      if (b === "VM") return 1;
      return 0;
    });

    // Sort publication types in logical order
    const pubTypeOrder = ["peer-reviewed", "preprint", "blog"];
    const sortedPubTypes = [...publicationTypes].sort(
      (a, b) => pubTypeOrder.indexOf(a) - pubTypeOrder.indexOf(b)
    );

    return {
      sizeCategories: orderedSizeCategories,
      wsiDataSizeCategories: orderedWsiDataSizeCategories,
      imageCaptionCategories: orderedImageCaptionCategories,
      hasHistologyPatches: hasHistologyPatches.value,
      methodCategories: sortedMethodCategories,
      licenseCategories: sortedLicenses,
      publicationYears: sortedYears,
      publicationTypes: sortedPubTypes,
      modelTypes: sortedModelTypes,
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
  const [selectedLicenses, setSelectedLicenses] = useState<Set<string>>(
    () => new Set(filterOptions.licenseCategories)
  );
  const [selectedYears, setSelectedYears] = useState<Set<string>>(
    () => new Set(filterOptions.publicationYears)
  );
  const [selectedModelTypes, setSelectedModelTypes] = useState<Set<string>>(
    () => new Set(filterOptions.modelTypes)
  );
  const [selectedPublicationTypes, setSelectedPublicationTypes] = useState<Set<string>>(
    () => new Set(filterOptions.publicationTypes)
  );

  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
      const licenseMatch = !m.license || selectedLicenses.has(m.license);
      const yearMatch = !m.publicationDate || selectedYears.has(m.publicationDate.split("-")[0]);
      const typeMatch = selectedModelTypes.has(isVLMModel(m) ? "VLM" : "VM");
      const pubTypeMatch = !m.publicationType || selectedPublicationTypes.has(m.publicationType);

      return sizeMatch && dataMatch && methodMatch && licenseMatch && yearMatch && typeMatch && pubTypeMatch;
    });
  }, [rankedModels, selectedSizeCategories, selectedWsiDataSizeCategories, selectedImageCaptionCategories, selectedHistologyPatches, selectedMethodCategories, selectedLicenses, selectedYears, selectedModelTypes, selectedPublicationTypes]);

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

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedSizeCategories(new Set(filterOptions.sizeCategories));
    setSelectedWsiDataSizeCategories(new Set(filterOptions.wsiDataSizeCategories));
    setSelectedImageCaptionCategories(new Set(filterOptions.imageCaptionCategories));
    setSelectedHistologyPatches(filterOptions.hasHistologyPatches);
    setSelectedMethodCategories(new Set(filterOptions.methodCategories));
    setSelectedLicenses(new Set(filterOptions.licenseCategories));
    setSelectedYears(new Set(filterOptions.publicationYears));
    setSelectedPublicationTypes(new Set(filterOptions.publicationTypes));
    setSelectedModelTypes(new Set(filterOptions.modelTypes));
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

  // Select/clear all for license categories
  const selectAllLicenses = () => {
    setSelectedLicenses(new Set(filterOptions.licenseCategories));
  };
  const clearAllLicenses = () => {
    setSelectedLicenses(new Set());
  };

  // Select/clear all for publication years
  const selectAllYears = () => {
    setSelectedYears(new Set(filterOptions.publicationYears));
  };
  const clearAllYears = () => {
    setSelectedYears(new Set());
  };

  // Select/clear all for model types
  const selectAllModelTypes = () => {
    setSelectedModelTypes(new Set(filterOptions.modelTypes));
  };
  const clearAllModelTypes = () => {
    setSelectedModelTypes(new Set());
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

  // License label helper
  const getLicenseLabel = (license: string) => {
    const labels: Record<string, string> = {
      "open-source": "Open Source",
      "non-commercial": "Non-Commercial",
      "closed-source": "Closed Source",
    };
    return labels[license] || license;
  };

  // Model type label helper
  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "VM": "Vision Model",
      "VLM": "Vision-Language Model",
    };
    return labels[type] || type;
  };

  // Publication type label helper
  const getPublicationTypeLabel = (pubType: string) => {
    const labels: Record<string, string> = {
      "peer-reviewed": "Peer-reviewed",
      "preprint": "Preprint",
      "blog": "Blog",
    };
    return labels[pubType] || pubType;
  };

  // Select/clear all for publication types
  const selectAllPublicationTypes = () => {
    setSelectedPublicationTypes(new Set(filterOptions.publicationTypes));
  };
  const clearAllPublicationTypes = () => {
    setSelectedPublicationTypes(new Set());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          An overview of pathology foundation models performance across multiple benchmarks
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
              {/* Filters */}
              <div className="mb-4">
                {/* Mobile filter toggle */}
                <div className="flex md:hidden items-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                    Filters
                    {mobileFiltersOpen ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    ({effectiveSelectedIds.size}/{allModelIds.length} models)
                  </span>
                </div>

                {/* Filter dropdowns - hidden on mobile unless toggled */}
                <div className={cn(
                  "flex flex-wrap items-center gap-2",
                  mobileFiltersOpen ? "flex" : "hidden md:flex"
                )}>
                  {/* Model Size Dropdown */}
                  <MultiSelectDropdown
                    label="Model Size"
                    size="sm"
                    options={filterOptions.sizeCategories.map((catId) => ({
                      id: catId,
                      label: getSizeCategoryLabel(catId),
                    }))}
                    selectedIds={selectedSizeCategories}
                    onToggle={(catId) => toggleFilter(catId, setSelectedSizeCategories)}
                    onSelectAll={selectAllSizeCategories}
                    onClearAll={clearAllSizeCategories}
                  />

                  {/* Pretraining Data Dropdown */}
                  <MultiSelectDropdown
                    label="Data"
                    size="sm"
                    options={[
                      ...filterOptions.wsiDataSizeCategories.map((catId) => ({
                        id: catId,
                        label: getWsiDataSizeCategoryLabel(catId),
                      })),
                      ...filterOptions.imageCaptionCategories.map((catId) => ({
                        id: catId,
                        label: getImageCaptionCategoryLabel(catId),
                      })),
                      ...(filterOptions.hasHistologyPatches ? [{ id: HISTOLOGY_PATCH_CATEGORY.id, label: HISTOLOGY_PATCH_CATEGORY.label }] : []),
                    ]}
                    selectedIds={new Set([
                      ...selectedWsiDataSizeCategories,
                      ...selectedImageCaptionCategories,
                      ...(selectedHistologyPatches ? [HISTOLOGY_PATCH_CATEGORY.id] : []),
                    ])}
                    onToggle={(catId) => {
                      if (catId.startsWith("ic-")) {
                        toggleFilter(catId, setSelectedImageCaptionCategories);
                      } else if (catId === HISTOLOGY_PATCH_CATEGORY.id) {
                        setSelectedHistologyPatches(!selectedHistologyPatches);
                      } else {
                        toggleFilter(catId, setSelectedWsiDataSizeCategories);
                      }
                    }}
                    onSelectAll={selectAllDataSizeCategories}
                    onClearAll={clearAllDataSizeCategories}
                  />

                  {/* Training Method Dropdown */}
                  <MultiSelectDropdown
                    label="Training"
                    size="sm"
                    options={filterOptions.methodCategories.map((category) => ({
                      id: category,
                      label: category,
                    }))}
                    selectedIds={selectedMethodCategories}
                    onToggle={(category) => toggleFilter(category, setSelectedMethodCategories)}
                    onSelectAll={selectAllMethodCategories}
                    onClearAll={clearAllMethodCategories}
                  />

                  {/* Model Type Dropdown */}
                  <MultiSelectDropdown
                    label="Type"
                    size="sm"
                    options={filterOptions.modelTypes.map((type) => ({
                      id: type,
                      label: getModelTypeLabel(type),
                    }))}
                    selectedIds={selectedModelTypes}
                    onToggle={(type) => toggleFilter(type, setSelectedModelTypes)}
                    onSelectAll={selectAllModelTypes}
                    onClearAll={clearAllModelTypes}
                  />

                  {/* License Dropdown */}
                  <MultiSelectDropdown
                    label="License"
                    size="sm"
                    options={filterOptions.licenseCategories.map((license) => ({
                      id: license,
                      label: getLicenseLabel(license),
                    }))}
                    selectedIds={selectedLicenses}
                    onToggle={(license) => toggleFilter(license, setSelectedLicenses)}
                    onSelectAll={selectAllLicenses}
                    onClearAll={clearAllLicenses}
                  />

                  {/* Publication Year Dropdown */}
                  <MultiSelectDropdown
                    label="Year"
                    size="sm"
                    options={filterOptions.publicationYears.map((year) => ({
                      id: year,
                      label: year,
                    }))}
                    selectedIds={selectedYears}
                    onToggle={(year) => toggleFilter(year, setSelectedYears)}
                    onSelectAll={selectAllYears}
                    onClearAll={clearAllYears}
                  />

                  {/* Publication Type Dropdown */}
                  <MultiSelectDropdown
                    label="Publication"
                    size="sm"
                    options={filterOptions.publicationTypes.map((pubType) => ({
                      id: pubType,
                      label: getPublicationTypeLabel(pubType),
                    }))}
                    selectedIds={selectedPublicationTypes}
                    onToggle={(pubType) => toggleFilter(pubType, setSelectedPublicationTypes)}
                    onSelectAll={selectAllPublicationTypes}
                    onClearAll={clearAllPublicationTypes}
                  />

                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={resetAllFilters}>
                    Reset All
                  </Button>

                  {/* Model count - hidden on mobile (shown above) */}
                  <span className="hidden md:inline text-xs text-muted-foreground">
                    ({effectiveSelectedIds.size}/{allModelIds.length} models)
                  </span>

                  <Link
                    href="/benchmarks"
                    className="text-sm text-primary hover:underline flex items-center gap-1 ml-auto"
                  >
                    View metrics →
                  </Link>
                </div>
              </div>

              <LeaderboardTable
                modelRankings={filteredModelRankings}
                models={models}
                benchmarks={benchmarks}
              />
        </CardContent>
      </Card>

      {/* Direct comparison */}
      <section className="mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Direct comparison</h1>
        <p className="mt-2 text-muted-foreground">
          Compare pathology foundation models on a common set of benchmarks
        </p>
      </div>

        <Card>
          <CardContent className="pt-6">
            <ScalingLawsChart
              models={models}
              tasks={tasks}
              results={results}
            />
          </CardContent>
        </Card>
      </section>

      {/* Model Size vs Performance */}
      <section className="mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Scaling laws</h1>
          <p className="mt-2 text-muted-foreground">
            Explore how model size correlates with performance or robustness across benchmarks
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ModelSizePerformanceChart
              models={models}
              tasks={tasks}
              results={results}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
