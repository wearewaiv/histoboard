/**
 * Model Attribute Filters Hook
 *
 * Reusable hook for filtering models by attributes (size, data, training,
 * type, license, year, publication type). Used by both the leaderboard
 * and models pages.
 *
 * @module hooks/useModelAttributeFilters
 */

import { useState, useMemo } from "react";
import type { Model } from "@/types";
import {
  SIZE_CATEGORIES,
  DATA_SIZE_CATEGORIES,
  IMAGE_CAPTION_CATEGORIES,
  HISTOLOGY_PATCH_CATEGORY,
  getSizeCategory,
  getDataSizeCategory,
  getTrainingMethodCategory,
  isVLMModel,
} from "@/lib/modelFilters";

// =============================================================================
// Types
// =============================================================================

export interface ModelAttributeFilterOptions {
  sizeCategories: string[];
  wsiDataSizeCategories: string[];
  imageCaptionCategories: string[];
  hasHistologyPatches: boolean;
  methodCategories: string[];
  licenseCategories: string[];
  publicationYears: string[];
  publicationTypes: string[];
  modelTypes: string[];
}

export interface UseModelAttributeFiltersReturn {
  filterOptions: ModelAttributeFilterOptions;

  // Selected filter values
  selectedSizeCategories: Set<string>;
  selectedWsiDataSizeCategories: Set<string>;
  selectedImageCaptionCategories: Set<string>;
  selectedHistologyPatches: boolean;
  selectedMethodCategories: Set<string>;
  selectedLicenses: Set<string>;
  selectedYears: Set<string>;
  selectedModelTypes: Set<string>;
  selectedPublicationTypes: Set<string>;

  // Derived data
  filteredByAttributes: Model[];

  // Toggle functions
  toggleSizeCategory: (id: string) => void;
  toggleWsiDataSizeCategory: (id: string) => void;
  toggleImageCaptionCategory: (id: string) => void;
  toggleHistologyPatches: () => void;
  toggleMethodCategory: (id: string) => void;
  toggleLicense: (id: string) => void;
  toggleYear: (id: string) => void;
  toggleModelType: (id: string) => void;
  togglePublicationType: (id: string) => void;

  // Bulk actions
  selectAllSizeCategories: () => void;
  clearAllSizeCategories: () => void;
  selectAllDataSizeCategories: () => void;
  clearAllDataSizeCategories: () => void;
  selectAllMethodCategories: () => void;
  clearAllMethodCategories: () => void;
  selectAllLicenses: () => void;
  clearAllLicenses: () => void;
  selectAllYears: () => void;
  clearAllYears: () => void;
  selectAllModelTypes: () => void;
  clearAllModelTypes: () => void;
  selectAllPublicationTypes: () => void;
  clearAllPublicationTypes: () => void;
  resetAllFilters: () => void;

  // Counts for display
  totalDataCategories: number;
  selectedDataCategoriesCount: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for filtering models by their attributes.
 *
 * @param models - Array of models to filter
 */
export function useModelAttributeFilters(
  models: Model[]
): UseModelAttributeFiltersReturn {
  // Extract unique filter values from models
  const filterOptions = useMemo((): ModelAttributeFilterOptions => {
    const sizeCategories = new Set<string>();
    const wsiDataSizeCategories = new Set<string>();
    const imageCaptionCategories = new Set<string>();
    let hasHistologyPatches = false;
    const methodCategories = new Set<string>();
    const licenseCategories = new Set<string>();
    const publicationYears = new Set<string>();
    const publicationTypes = new Set<string>();
    const modelTypes = new Set<string>();

    models.forEach((m) => {
      if (m.params) sizeCategories.add(getSizeCategory(m.params));
      if (m.pretrainingData) {
        const cat = getDataSizeCategory(m.pretrainingData);
        if (cat) {
          if (cat.startsWith("ic-")) {
            imageCaptionCategories.add(cat);
          } else if (cat === HISTOLOGY_PATCH_CATEGORY.id) {
            hasHistologyPatches = true;
          } else {
            wsiDataSizeCategories.add(cat);
          }
        }
      }
      methodCategories.add(getTrainingMethodCategory(m));
      if (m.license) licenseCategories.add(m.license);
      if (m.publicationDate) {
        publicationYears.add(m.publicationDate.split("-")[0]);
      }
      if (m.publicationType) publicationTypes.add(m.publicationType);
      modelTypes.add(isVLMModel(m) ? "VLM" : "VM");
    });

    const orderedSizeCategories = SIZE_CATEGORIES
      .filter((cat) => sizeCategories.has(cat.id))
      .map((cat) => cat.id);

    const orderedWsiDataSizeCategories = DATA_SIZE_CATEGORIES
      .filter((cat) => wsiDataSizeCategories.has(cat.id))
      .map((cat) => cat.id);

    const orderedImageCaptionCategories = IMAGE_CAPTION_CATEGORIES
      .filter((cat) => imageCaptionCategories.has(cat.id))
      .map((cat) => cat.id);

    const sortedMethodCategories = [...methodCategories].sort((a, b) => {
      if (a === "VLM") return -1;
      if (b === "VLM") return 1;
      return a.localeCompare(b);
    });

    const sortedYears = [...publicationYears].sort((a, b) => b.localeCompare(a));

    const licenseOrder = ["open-source", "non-commercial", "closed-source"];
    const sortedLicenses = [...licenseCategories].sort(
      (a, b) => licenseOrder.indexOf(a) - licenseOrder.indexOf(b)
    );

    const sortedModelTypes = [...modelTypes].sort((a, b) => {
      if (a === "VM") return -1;
      if (b === "VM") return 1;
      return 0;
    });

    const pubTypeOrder = ["peer-reviewed", "preprint", "blog"];
    const sortedPubTypes = [...publicationTypes].sort(
      (a, b) => pubTypeOrder.indexOf(a) - pubTypeOrder.indexOf(b)
    );

    return {
      sizeCategories: orderedSizeCategories,
      wsiDataSizeCategories: orderedWsiDataSizeCategories,
      imageCaptionCategories: orderedImageCaptionCategories,
      hasHistologyPatches,
      methodCategories: sortedMethodCategories,
      licenseCategories: sortedLicenses,
      publicationYears: sortedYears,
      publicationTypes: sortedPubTypes,
      modelTypes: sortedModelTypes,
    };
  }, [models]);

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

  // Helper to toggle a value in a Set
  const toggleInSet = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // Models filtered by attribute filters
  const filteredByAttributes = useMemo(() => {
    return models.filter((m) => {
      const sizeMatch = !m.params || selectedSizeCategories.has(getSizeCategory(m.params));

      let dataMatch = true;
      if (m.pretrainingData) {
        const dataCat = getDataSizeCategory(m.pretrainingData);
        if (dataCat) {
          if (dataCat.startsWith("ic-")) {
            dataMatch = selectedImageCaptionCategories.has(dataCat);
          } else if (dataCat === HISTOLOGY_PATCH_CATEGORY.id) {
            dataMatch = selectedHistologyPatches;
          } else {
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
  }, [
    models,
    selectedSizeCategories,
    selectedWsiDataSizeCategories,
    selectedImageCaptionCategories,
    selectedHistologyPatches,
    selectedMethodCategories,
    selectedLicenses,
    selectedYears,
    selectedModelTypes,
    selectedPublicationTypes,
  ]);

  // Counts for display
  const totalDataCategories =
    filterOptions.wsiDataSizeCategories.length +
    filterOptions.imageCaptionCategories.length +
    (filterOptions.hasHistologyPatches ? 1 : 0);

  const selectedDataCategoriesCount =
    selectedWsiDataSizeCategories.size +
    selectedImageCaptionCategories.size +
    (selectedHistologyPatches ? 1 : 0);

  // Reset all attribute filters
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

  return {
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
    filteredByAttributes,

    // Toggle functions
    toggleSizeCategory: (id) => toggleInSet(id, setSelectedSizeCategories),
    toggleWsiDataSizeCategory: (id) => toggleInSet(id, setSelectedWsiDataSizeCategories),
    toggleImageCaptionCategory: (id) => toggleInSet(id, setSelectedImageCaptionCategories),
    toggleHistologyPatches: () => setSelectedHistologyPatches((prev) => !prev),
    toggleMethodCategory: (id) => toggleInSet(id, setSelectedMethodCategories),
    toggleLicense: (id) => toggleInSet(id, setSelectedLicenses),
    toggleYear: (id) => toggleInSet(id, setSelectedYears),
    toggleModelType: (id) => toggleInSet(id, setSelectedModelTypes),
    togglePublicationType: (id) => toggleInSet(id, setSelectedPublicationTypes),

    // Bulk actions
    selectAllSizeCategories: () => setSelectedSizeCategories(new Set(filterOptions.sizeCategories)),
    clearAllSizeCategories: () => setSelectedSizeCategories(new Set()),
    selectAllDataSizeCategories: () => {
      setSelectedWsiDataSizeCategories(new Set(filterOptions.wsiDataSizeCategories));
      setSelectedImageCaptionCategories(new Set(filterOptions.imageCaptionCategories));
      setSelectedHistologyPatches(filterOptions.hasHistologyPatches);
    },
    clearAllDataSizeCategories: () => {
      setSelectedWsiDataSizeCategories(new Set());
      setSelectedImageCaptionCategories(new Set());
      setSelectedHistologyPatches(false);
    },
    selectAllMethodCategories: () => setSelectedMethodCategories(new Set(filterOptions.methodCategories)),
    clearAllMethodCategories: () => setSelectedMethodCategories(new Set()),
    selectAllLicenses: () => setSelectedLicenses(new Set(filterOptions.licenseCategories)),
    clearAllLicenses: () => setSelectedLicenses(new Set()),
    selectAllYears: () => setSelectedYears(new Set(filterOptions.publicationYears)),
    clearAllYears: () => setSelectedYears(new Set()),
    selectAllModelTypes: () => setSelectedModelTypes(new Set(filterOptions.modelTypes)),
    clearAllModelTypes: () => setSelectedModelTypes(new Set()),
    selectAllPublicationTypes: () => setSelectedPublicationTypes(new Set(filterOptions.publicationTypes)),
    clearAllPublicationTypes: () => setSelectedPublicationTypes(new Set()),
    resetAllFilters,

    totalDataCategories,
    selectedDataCategoriesCount,
  };
}
