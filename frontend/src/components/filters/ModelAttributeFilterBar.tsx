"use client";

/**
 * Model Attribute Filter Bar
 *
 * Renders the shared 7 filter dropdowns (Size, Data, Training, Type,
 * License, Year, Publication) + Reset button. Used by both the
 * leaderboard and models pages.
 *
 * @module components/filters/ModelAttributeFilterBar
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
} from "@/lib/modelFilters";
import type { UseModelAttributeFiltersReturn } from "@/hooks/useModelAttributeFilters";

interface ModelAttributeFilterBarProps {
  filters: UseModelAttributeFiltersReturn;
  /** Size variant for dropdowns */
  size?: "sm" | "default";
  /** Optional extra elements rendered after the Reset button */
  children?: React.ReactNode;
}

export function ModelAttributeFilterBar({
  filters,
  size,
  children,
}: ModelAttributeFilterBarProps) {
  const {
    filterOptions,
    selectedSizeCategories,
    selectedWsiDataSizeCategories,
    selectedImageCaptionCategories,
    selectedHistologyPatches,
    selectedMethodCategories,
    selectedLicenses,
    toggleSizeCategory,
    toggleWsiDataSizeCategory,
    toggleImageCaptionCategory,
    toggleHistologyPatches,
    toggleMethodCategory,
    toggleLicense,
    selectAllSizeCategories,
    clearAllSizeCategories,
    selectAllDataSizeCategories,
    clearAllDataSizeCategories,
    selectAllMethodCategories,
    clearAllMethodCategories,
    selectAllLicenses,
    clearAllLicenses,
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
    <>
      {/* Model Size Dropdown */}
      <MultiSelectDropdown
        label="Model Size"
        size={size}
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
        size={size}
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
        size={size}
        options={filterOptions.methodCategories.map((category) => ({
          id: category,
          label: category,
        }))}
        selectedIds={selectedMethodCategories}
        onToggle={toggleMethodCategory}
        onSelectAll={selectAllMethodCategories}
        onClearAll={clearAllMethodCategories}
      />

      {/* License Dropdown */}
      <MultiSelectDropdown
        label="License"
        size={size}
        options={filterOptions.licenseCategories.map((license) => ({
          id: license,
          label: getLicenseLabel(license),
        }))}
        selectedIds={selectedLicenses}
        onToggle={toggleLicense}
        onSelectAll={selectAllLicenses}
        onClearAll={clearAllLicenses}
      />

      <Button
        variant="outline"
        size="sm"
        className="text-xs h-8"
        onClick={resetAllFilters}
      >
        Reset All
      </Button>

      {children}
    </>
  );
}
