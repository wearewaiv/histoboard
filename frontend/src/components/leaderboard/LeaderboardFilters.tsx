"use client";

/**
 * Leaderboard Filters Component
 *
 * This component renders the row of filter dropdowns at the top of the
 * leaderboard page. Users can filter models by various criteria like
 * size, training data, license type, publication year, etc.
 *
 * ## Component Structure
 *
 * The filters are displayed as a horizontal row of dropdown buttons:
 *
 * ```
 * [Model Size ▼] [Data ▼] [Training ▼] [Type ▼] [License ▼] [Year ▼] [Publication ▼] [Models ▼] [Reset All]  (5/47 models)
 * ```
 *
 * Each dropdown uses the MultiSelectDropdown component, which shows:
 * - Checkboxes for each option
 * - "Select All" and "Clear All" buttons
 * - A count of selected items in the button label
 *
 * ## How It Works
 *
 * This component is a "presentation" component - it only renders the UI.
 * All the filter logic (what options exist, what's selected, how to toggle)
 * is managed by the useLeaderboardFilters hook and passed in via the
 * `filters` prop.
 *
 * ## Props
 *
 * - `filters`: All filter state and toggle functions from useLeaderboardFilters
 * - `allModelCount`: Total number of models (for the "X/Y models" display)
 *
 * ## Usage Example
 *
 * ```tsx
 * // In the parent component (leaderboard page):
 * const filters = useLeaderboardFilters(models, benchmarks, rankings);
 *
 * return (
 *   <div>
 *     <LeaderboardFilters filters={filters} allModelCount={models.length} />
 *     <LeaderboardTable models={filters.effectiveSelectedIds} ... />
 *   </div>
 * );
 * ```
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  HISTOLOGY_PATCH_CATEGORY,
  getSizeCategoryLabel,
  getWsiDataSizeCategoryLabel,
  getImageCaptionCategoryLabel,
  getLicenseLabel,
  getModelTypeLabel,
  getPublicationTypeLabel,
} from "@/lib/modelFilters";
import type { UseLeaderboardFiltersReturn } from "@/hooks/useLeaderboardFilters";

interface LeaderboardFiltersProps {
  filters: UseLeaderboardFiltersReturn;
  allModelCount: number;
}

export function LeaderboardFilters({
  filters,
  allModelCount,
}: LeaderboardFiltersProps) {
  const {
    filterOptions,
    selectedSizeCategories,
    selectedWsiDataSizeCategories,
    selectedImageCaptionCategories,
    selectedHistologyPatches,
    selectedMethodCategories,
    selectedLicenses,
    selectedYears,
    selectedModelTypes,
    selectedPublicationTypes,
    selectedModelIds,
    effectiveSelectedIds,
    sortedModels,
    toggleSizeCategory,
    toggleWsiDataSizeCategory,
    toggleImageCaptionCategory,
    toggleHistologyPatches,
    toggleMethodCategory,
    toggleLicense,
    toggleYear,
    toggleModelType,
    togglePublicationType,
    toggleModel,
    selectAllSizeCategories,
    clearAllSizeCategories,
    selectAllDataSizeCategories,
    clearAllDataSizeCategories,
    selectAllMethodCategories,
    clearAllMethodCategories,
    selectAllLicenses,
    clearAllLicenses,
    selectAllYears,
    clearAllYears,
    selectAllModelTypes,
    clearAllModelTypes,
    selectAllPublicationTypes,
    clearAllPublicationTypes,
    selectAllModels,
    clearAllModels,
    resetAllFilters,
  } = filters;

  // Handle data category toggle (routes to correct setter based on category type)
  const handleDataCategoryToggle = (catId: string) => {
    if (catId.startsWith("ic-")) {
      toggleImageCaptionCategory(catId);
    } else if (catId === HISTOLOGY_PATCH_CATEGORY.id) {
      toggleHistologyPatches();
    } else {
      toggleWsiDataSizeCategory(catId);
    }
  };

  // Build combined data categories selected set
  const selectedDataCategories = new Set([
    ...selectedWsiDataSizeCategories,
    ...selectedImageCaptionCategories,
    ...(selectedHistologyPatches ? [HISTOLOGY_PATCH_CATEGORY.id] : []),
  ]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Model Size Dropdown */}
      <MultiSelectDropdown
        label="Model Size"
        size="sm"
        options={filterOptions.sizeCategories.map((catId) => ({
          id: catId,
          label: getSizeCategoryLabel(catId),
        }))}
        selectedIds={selectedSizeCategories}
        onToggle={toggleSizeCategory}
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
          ...(filterOptions.hasHistologyPatches
            ? [{ id: HISTOLOGY_PATCH_CATEGORY.id, label: HISTOLOGY_PATCH_CATEGORY.label }]
            : []),
        ]}
        selectedIds={selectedDataCategories}
        onToggle={handleDataCategoryToggle}
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
        onToggle={toggleMethodCategory}
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
        onToggle={toggleModelType}
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
        onToggle={toggleLicense}
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
        onToggle={toggleYear}
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
        onToggle={togglePublicationType}
        onSelectAll={selectAllPublicationTypes}
        onClearAll={clearAllPublicationTypes}
      />

      {/* Models Dropdown */}
      <MultiSelectDropdown
        label="Models"
        size="sm"
        options={sortedModels.map((model) => ({
          id: model.id,
          label: model.name,
        }))}
        selectedIds={selectedModelIds}
        onToggle={toggleModel}
        onSelectAll={selectAllModels}
        onClearAll={clearAllModels}
      />

      <Button
        variant="outline"
        size="sm"
        className="text-xs h-8"
        onClick={resetAllFilters}
      >
        Reset All
      </Button>

      <span className="text-xs text-muted-foreground">
        ({effectiveSelectedIds.size}/{allModelCount} models)
      </span>
    </div>
  );
}
