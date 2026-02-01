/**
 * Leaderboard Filters Hook
 *
 * This hook manages all the filter state for the leaderboard page. It handles
 * the logic for which models to show based on user-selected criteria like
 * model size, license type, publication year, etc.
 *
 * ## What is a React Hook?
 *
 * A "hook" is a special function in React that lets you use features like
 * state management inside components. Custom hooks (like this one) combine
 * multiple React hooks to provide reusable logic. Hooks always start with "use".
 *
 * ## What This Hook Does
 *
 * The leaderboard page has many dropdown filters (Size, Data, Training, etc.).
 * This hook manages:
 *
 * 1. **Filter Options** - What choices are available in each dropdown?
 *    Extracted from the actual models in the database.
 *
 * 2. **Selected Values** - Which options has the user checked/unchecked?
 *    Each filter is a Set of selected option IDs.
 *
 * 3. **Filtered Models** - Which models match all the selected filters?
 *    A model must pass ALL filters to be shown (AND logic).
 *
 * 4. **Toggle Functions** - Functions to check/uncheck individual options.
 *    Called when user clicks a checkbox in a dropdown.
 *
 * 5. **Bulk Actions** - "Select All" and "Clear All" for each filter.
 *
 * ## Filter Categories
 *
 * - **Model Size**: How many parameters (weights) the model has (e.g., 100M-500M)
 * - **Data**: What training data was used (e.g., WSIs, image-caption pairs)
 * - **Training**: The training method (e.g., DINO, MAE, CLIP)
 * - **Type**: Vision Model (VM) vs Vision-Language Model (VLM)
 * - **License**: Open-source, non-commercial, or closed-source
 * - **Year**: Publication year
 * - **Publication**: Peer-reviewed, preprint, or blog post
 * - **Models**: Individual model selection
 *
 * ## How Filtering Works
 *
 * ```
 * All Models
 *     ↓
 * [Filter by Size] → models with matching size category
 *     ↓
 * [Filter by Data] → models with matching data category
 *     ↓
 * [Filter by Training] → models with matching method
 *     ↓
 * [Filter by License] → models with matching license
 *     ↓
 * [Filter by Year] → models from selected years
 *     ↓
 * [Filter by Type] → VM or VLM models
 *     ↓
 * [Filter by Publication] → peer-reviewed, preprint, blog
 *     ↓
 * [Intersect with Selected Models] → final visible models
 * ```
 *
 * ## Usage Example
 *
 * ```typescript
 * const filters = useLeaderboardFilters(models, benchmarks, rankings);
 *
 * // Access selected values
 * console.log(filters.selectedYears); // Set { "2024", "2023" }
 *
 * // Toggle a filter option
 * filters.toggleYear("2022"); // Add or remove 2022 from selection
 *
 * // Bulk actions
 * filters.selectAllYears();  // Select all years
 * filters.clearAllYears();   // Clear all years
 *
 * // Get filtered models
 * console.log(filters.effectiveSelectedIds); // Set of visible model IDs
 * ```
 *
 * @module hooks/useLeaderboardFilters
 */

import { useState, useMemo } from "react";
import type { Model, Benchmark } from "@/types";
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

/**
 * Filter options extracted from available models.
 */
export interface LeaderboardFilterOptions {
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

/**
 * Return type for the useLeaderboardFilters hook.
 */
export interface UseLeaderboardFiltersReturn {
  // Filter options
  filterOptions: LeaderboardFilterOptions;

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
  selectedModelIds: Set<string>;

  // Derived data
  filteredByAttributes: Model[];
  effectiveSelectedIds: Set<string>;
  sortedModels: Model[];

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
  toggleModel: (id: string) => void;

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
  selectAllModels: () => void;
  clearAllModels: () => void;
  resetAllFilters: () => void;

  // Counts for display
  totalDataCategories: number;
  selectedDataCategoriesCount: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing leaderboard filter state.
 *
 * @param models - All available models
 * @param benchmarks - All benchmarks
 * @param rankings - Rankings data: benchmarkId -> modelId -> { avgRank, taskCount }
 */
export function useLeaderboardFilters(
  models: Model[],
  benchmarks: Benchmark[],
  rankings: Record<string, Record<string, { avgRank: number; taskCount: number }>>
): UseLeaderboardFiltersReturn {
  // Get all models that have rankings
  const rankedModels = useMemo(() => {
    return models.filter((m) => benchmarks.some((b) => rankings[b.id]?.[m.id]));
  }, [models, benchmarks, rankings]);

  // Get all model IDs that have rankings
  const allModelIds = useMemo(() => rankedModels.map((m) => m.id), [rankedModels]);

  // Extract unique filter values from ranked models
  const filterOptions = useMemo((): LeaderboardFilterOptions => {
    const sizeCategories = new Set<string>();
    const wsiDataSizeCategories = new Set<string>();
    const imageCaptionCategories = new Set<string>();
    let hasHistologyPatches = false;
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

    // Sort and filter categories
    const orderedSizeCategories = SIZE_CATEGORIES
      .filter((cat) => sizeCategories.has(cat.id))
      .map((cat) => cat.id);

    const orderedWsiDataSizeCategories = DATA_SIZE_CATEGORIES
      .filter((cat) => wsiDataSizeCategories.has(cat.id))
      .map((cat) => cat.id);

    const orderedImageCaptionCategories = IMAGE_CAPTION_CATEGORIES
      .filter((cat) => imageCaptionCategories.has(cat.id))
      .map((cat) => cat.id);

    // Put VLM first, then sort alphabetically
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
  }, [rankedModels]);

  // Filter states
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
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(
    () => new Set(allModelIds)
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
    return rankedModels.filter((m) => {
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
    rankedModels,
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

  // Effective selected models = intersection of manual selection and attribute filters
  const filteredModelIds = useMemo(
    () => new Set(filteredByAttributes.map((m) => m.id)),
    [filteredByAttributes]
  );

  const effectiveSelectedIds = useMemo(() => {
    return new Set([...selectedModelIds].filter((id) => filteredModelIds.has(id)));
  }, [selectedModelIds, filteredModelIds]);

  // Models sorted for display in filter dropdown
  const sortedModels = useMemo(() => {
    return [...filteredByAttributes].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredByAttributes]);

  // Counts for display
  const totalDataCategories =
    filterOptions.wsiDataSizeCategories.length +
    filterOptions.imageCaptionCategories.length +
    (filterOptions.hasHistologyPatches ? 1 : 0);

  const selectedDataCategoriesCount =
    selectedWsiDataSizeCategories.size +
    selectedImageCaptionCategories.size +
    (selectedHistologyPatches ? 1 : 0);

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
    selectedModelIds,
    filteredByAttributes,
    effectiveSelectedIds,
    sortedModels,

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
    toggleModel: (id) => toggleInSet(id, setSelectedModelIds),

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
    selectAllModels: () => setSelectedModelIds(new Set(allModelIds)),
    clearAllModels: () => setSelectedModelIds(new Set()),
    resetAllFilters,

    totalDataCategories,
    selectedDataCategoriesCount,
  };
}
