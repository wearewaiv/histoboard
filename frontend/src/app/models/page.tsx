"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import modelsData from "@/data/models.json";
import rankingsData from "@/data/rankings.json";

import type { Model } from "@/types";

const models = (modelsData as Model[]).sort((a, b) => a.name.localeCompare(b.name));

// Training methods that are considered VLM-style
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

  return null;
}
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

const BENCHMARKS = [
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

function getMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique filter values from all models
  const filterOptions = useMemo(() => {
    const sizeCategories = new Set<string>();
    const wsiDataSizeCategories = new Set<string>();
    const imageCaptionCategories = new Set<string>();
    const hasHistologyPatches = { value: false };
    const methodCategories = new Set<string>();
    const licenseCategories = new Set<string>();
    const publicationYears = new Set<string>();
    const modelTypes = new Set<string>();

    const publicationTypes = new Set<string>();

    models.forEach((m) => {
      if (m.params) sizeCategories.add(getSizeCategory(m.params));
      if (m.pretrainingData) {
        const cat = getDataSizeCategory(m.pretrainingData);
        if (cat) {
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

    // Return WSI data size categories in order
    const orderedWsiDataSizeCategories = DATA_SIZE_CATEGORIES
      .filter((cat) => wsiDataSizeCategories.has(cat.id))
      .map((cat) => cat.id);

    // Return image-caption categories in order
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
  }, []);

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

  // Toggle helper
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

  // Helper to get category labels
  const getSizeCategoryLabel = (catId: string) => {
    return SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getLicenseLabel = (license: string) => {
    const labels: Record<string, string> = {
      "open-source": "Open Source",
      "non-commercial": "Non-Commercial",
      "closed-source": "Closed Source",
    };
    return labels[license] || license;
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "VM": "Vision Model",
      "VLM": "Vision-Language Model",
    };
    return labels[type] || type;
  };

  const getWsiDataSizeCategoryLabel = (catId: string) => {
    return DATA_SIZE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getImageCaptionCategoryLabel = (catId: string) => {
    return IMAGE_CAPTION_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getPublicationTypeLabel = (pubType: string) => {
    const labels: Record<string, string> = {
      "peer-reviewed": "Peer-reviewed",
      "preprint": "Preprint",
      "blog": "Blog",
    };
    return labels[pubType] || pubType;
  };

  // Filter models based on all filters
  const filteredModels = useMemo(() => {
    let result = models;

    // Filter by model size
    result = result.filter((m) => !m.params || selectedSizeCategories.has(getSizeCategory(m.params)));

    // Filter by pretraining data size
    result = result.filter((m) => {
      if (!m.pretrainingData) return true;
      const dataCat = getDataSizeCategory(m.pretrainingData);
      if (!dataCat) return true;
      if (dataCat.startsWith("ic-")) {
        return selectedImageCaptionCategories.has(dataCat);
      } else if (dataCat === HISTOLOGY_PATCH_CATEGORY.id) {
        return selectedHistologyPatches;
      } else {
        return selectedWsiDataSizeCategories.has(dataCat);
      }
    });

    // Filter by training method
    result = result.filter((m) => selectedMethodCategories.has(getTrainingMethodCategory(m)));

    // Filter by license
    result = result.filter((m) => !m.license || selectedLicenses.has(m.license));

    // Filter by publication year
    result = result.filter((m) => !m.publicationDate || selectedYears.has(m.publicationDate.split("-")[0]));

    // Filter by model type
    result = result.filter((m) => selectedModelTypes.has(isVLMModel(m) ? "VLM" : "VM"));

    // Filter by publication type
    result = result.filter((m) => !m.publicationType || selectedPublicationTypes.has(m.publicationType));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.organization.toLowerCase().includes(query) ||
          model.architecture.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedSizeCategories, selectedWsiDataSizeCategories, selectedImageCaptionCategories, selectedHistologyPatches, selectedMethodCategories, selectedLicenses, selectedYears, selectedPublicationTypes, selectedModelTypes]);

  // Compute integer ranks per benchmark
  const benchmarkRanks = useMemo(() => {
    const result: Record<string, { ranks: Map<string, number>; total: number }> = {};

    for (const benchmark of BENCHMARKS) {
      const benchmarkData = rankings[benchmark.id];
      if (!benchmarkData) continue;

      // Get all models with rankings for this benchmark, sorted by avgRank
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
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Models</h1>
        <p className="mt-2 text-muted-foreground">
          Browse {models.length} pathology foundation models and their benchmark
          performance
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Model Size Dropdown */}
          <MultiSelectDropdown
            label="Model Size"
            options={filterOptions.sizeCategories.map((catId) => ({
              id: catId,
              label: getSizeCategoryLabel(catId),
            }))}
            selectedIds={selectedSizeCategories}
            onToggle={(catId) => toggleFilter(catId, setSelectedSizeCategories)}
            onSelectAll={() => setSelectedSizeCategories(new Set(filterOptions.sizeCategories))}
            onClearAll={() => setSelectedSizeCategories(new Set())}
          />

          {/* Pretraining Data Dropdown */}
          <MultiSelectDropdown
            label="Pretraining Data"
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
            options={filterOptions.methodCategories.map((category) => ({
              id: category,
              label: category,
            }))}
            selectedIds={selectedMethodCategories}
            onToggle={(category) => toggleFilter(category, setSelectedMethodCategories)}
            onSelectAll={() => setSelectedMethodCategories(new Set(filterOptions.methodCategories))}
            onClearAll={() => setSelectedMethodCategories(new Set())}
          />

          {/* Model Type Dropdown */}
          <MultiSelectDropdown
            label="Type"
            options={filterOptions.modelTypes.map((type) => ({
              id: type,
              label: getModelTypeLabel(type),
            }))}
            selectedIds={selectedModelTypes}
            onToggle={(type) => toggleFilter(type, setSelectedModelTypes)}
            onSelectAll={() => setSelectedModelTypes(new Set(filterOptions.modelTypes))}
            onClearAll={() => setSelectedModelTypes(new Set())}
          />

          {/* License Dropdown */}
          <MultiSelectDropdown
            label="License"
            options={filterOptions.licenseCategories.map((license) => ({
              id: license,
              label: getLicenseLabel(license),
            }))}
            selectedIds={selectedLicenses}
            onToggle={(license) => toggleFilter(license, setSelectedLicenses)}
            onSelectAll={() => setSelectedLicenses(new Set(filterOptions.licenseCategories))}
            onClearAll={() => setSelectedLicenses(new Set())}
          />

          {/* Publication Year Dropdown */}
          <MultiSelectDropdown
            label="Year"
            options={filterOptions.publicationYears.map((year) => ({
              id: year,
              label: year,
            }))}
            selectedIds={selectedYears}
            onToggle={(year) => toggleFilter(year, setSelectedYears)}
            onSelectAll={() => setSelectedYears(new Set(filterOptions.publicationYears))}
            onClearAll={() => setSelectedYears(new Set())}
          />

          {/* Publication Type Dropdown */}
          <MultiSelectDropdown
            label="Publication"
            options={filterOptions.publicationTypes.map((pubType) => ({
              id: pubType,
              label: getPublicationTypeLabel(pubType),
            }))}
            selectedIds={selectedPublicationTypes}
            onToggle={(pubType) => toggleFilter(pubType, setSelectedPublicationTypes)}
            onSelectAll={() => setSelectedPublicationTypes(new Set(filterOptions.publicationTypes))}
            onClearAll={() => setSelectedPublicationTypes(new Set())}
          />

          {/* Search */}
          <div className="relative min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <Button variant="outline" size="sm" onClick={resetAllFilters}>
            Reset All
          </Button>

          <span className="text-sm text-muted-foreground">
            ({filteredModels.length}/{models.length} models)
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map((model) => {
          // Check if model has any benchmark rankings
          const hasRankings = BENCHMARKS.some(
            (b) => benchmarkRanks[b.id]?.ranks.has(model.id)
          );

          return (
            <Card key={model.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {model.organization}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {model.license && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          model.license === "open-source" && "bg-green-500/20 border-green-500 text-green-700",
                          model.license === "non-commercial" && "bg-yellow-500/20 border-yellow-500 text-yellow-700",
                          model.license === "closed-source" && "bg-red-500/20 border-red-500 text-red-700"
                        )}
                      >
                        {model.license === "open-source" && "Open Source"}
                        {model.license === "non-commercial" && "Non-Commercial"}
                        {model.license === "closed-source" && "Closed Source"}
                      </Badge>
                    )}
                    {model.publicationType && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          model.publicationType === "peer-reviewed" && "bg-blue-500/20 border-blue-500 text-blue-700",
                          model.publicationType === "preprint" && "bg-purple-500/20 border-purple-500 text-purple-700",
                          model.publicationType === "blog" && "bg-orange-500/20 border-orange-500 text-orange-700"
                        )}
                      >
                        {model.publicationType === "peer-reviewed" && "Peer-reviewed"}
                        {model.publicationType === "preprint" && "Preprint"}
                        {model.publicationType === "blog" && "Blog"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Architecture</dt>
                    <dd className="font-medium">{model.architecture}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Parameters</dt>
                    <dd className="font-medium">{model.params}</dd>
                  </div>
                  {model.trainingMethod && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Training Method</dt>
                      <dd className="font-medium">{model.trainingMethod}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Training Data</dt>
                    <dd className="font-medium text-right max-w-[60%] truncate">
                      {model.pretrainingData}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Release Date</dt>
                    <dd className="font-medium">{model.publicationDate}</dd>
                  </div>
                </dl>

                {/* Benchmark Rankings */}
                {hasRankings && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Benchmark Rankings</p>
                    <div className="flex flex-wrap gap-2">
                      {BENCHMARKS.map((benchmark) => {
                        const data = benchmarkRanks[benchmark.id];
                        if (!data) return null;

                        const rank = data.ranks.get(model.id);
                        if (rank === undefined) return null;

                        const medal = getMedal(rank);

                        return (
                          <Badge
                            key={benchmark.id}
                            variant="outline"
                            className={cn(
                              rank === 1 && "bg-yellow-500/20 border-yellow-500",
                              rank === 2 && "bg-gray-400/20 border-gray-400",
                              rank === 3 && "bg-amber-600/20 border-amber-600"
                            )}
                          >
                            {medal && <span className="mr-1">{medal}</span>}
                            {benchmark.name}: {rank}/{data.total}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {model.paperUrl && (
                    <a
                      href={model.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Paper
                      </Badge>
                    </a>
                  )}
                  {model.blogUrl && (
                    <a
                      href={model.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Blog
                      </Badge>
                    </a>
                  )}
                  {model.codeUrl && (
                    <a
                      href={model.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Code
                      </Badge>
                    </a>
                  )}
                  {model.weightsUrl && (
                    <a
                      href={model.weightsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Weights
                      </Badge>
                    </a>
                  )}
                  {model.datasetUrl && (
                    <a
                      href={model.datasetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Dataset
                      </Badge>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
