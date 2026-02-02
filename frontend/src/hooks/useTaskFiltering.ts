/**
 * useTaskFiltering Hook
 *
 * A comprehensive hook for filtering tasks in detailed benchmark tables.
 * Supports multi-dimensional filtering (organs, categories, task names)
 * with optional text search functionality.
 *
 * @example
 * ```tsx
 * const { filteredTasks, filters } = useTaskFiltering(tasks, {
 *   enableSearch: true,
 *   searchFields: ['name', 'organ', 'category'],
 * });
 *
 * // Access filter controls:
 * filters.organs.toggle('breast');
 * filters.search.setQuery('cancer');
 * ```
 */
import { useState, useMemo, useCallback } from "react";
import type { Task } from "@/types";
import { useSetToggle, type UseSetToggleReturn } from "./useSetToggle";

/**
 * Configuration options for task filtering
 */
export interface TaskFilteringConfig {
  /** Enable text search functionality */
  enableSearch?: boolean;
  /** Fields to include in text search (default: ['name', 'organ', 'category']) */
  searchFields?: Array<keyof Task | string>;
  /** Custom function to extract searchable text from a task */
  getSearchableText?: (task: Task) => string;
  /** Sort function for filtered results (default: alphabetical by name) */
  sortFn?: (a: Task, b: Task) => number;
  /** Custom category extractor (for tasks with non-standard category fields) */
  getCategoryFn?: (task: Task) => string;
  /** Whether to use search when query exists, ignoring other filters */
  searchOverridesFilters?: boolean;
}

/**
 * Search state and controls
 */
export interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  isActive: boolean;
}

/**
 * Return type for useTaskFiltering hook
 */
export interface UseTaskFilteringReturn {
  /** Tasks after applying all filters */
  filteredTasks: Task[];
  /** Organ filter controls */
  organs: UseSetToggleReturn<string>;
  /** Category filter controls */
  categories: UseSetToggleReturn<string>;
  /** Task name filter controls */
  taskNames: UseSetToggleReturn<string>;
  /** Search state and controls (if enabled) */
  search: SearchState;
  /** Reset all filters to default (all selected) */
  resetAllFilters: () => void;
  /** Available unique organs from tasks */
  availableOrgans: string[];
  /** Available unique categories from tasks */
  availableCategories: string[];
  /** Available unique task names from tasks */
  availableTaskNames: string[];
}

/**
 * Default sort function - alphabetical by task name
 */
const defaultSortFn = (a: Task, b: Task) => a.name.localeCompare(b.name);

/**
 * Default category extractor
 */
const defaultGetCategory = (task: Task): string =>
  typeof task.category === "string" ? task.category : String(task.category || "");

/**
 * Build searchable text from a task based on specified fields
 */
function buildSearchableText(
  task: Task,
  fields: Array<keyof Task | string>,
  getCategoryFn: (task: Task) => string
): string {
  const values: string[] = [];

  for (const field of fields) {
    if (field === "category") {
      values.push(getCategoryFn(task));
    } else if (field in task) {
      const value = task[field as keyof Task];
      if (value !== undefined && value !== null) {
        values.push(String(value));
      }
    }
  }

  return values.join(" ").toLowerCase();
}

/**
 * Hook for filtering tasks with multi-dimensional filters and optional search
 *
 * @param tasks - Array of tasks to filter
 * @param config - Configuration options
 * @returns Filtered tasks and filter controls
 */
export function useTaskFiltering(
  tasks: Task[],
  config: TaskFilteringConfig = {}
): UseTaskFilteringReturn {
  const {
    enableSearch = false,
    searchFields = ["name", "organ", "category"],
    getSearchableText,
    sortFn = defaultSortFn,
    getCategoryFn = defaultGetCategory,
    searchOverridesFilters = true,
  } = config;

  // Extract unique values for each filter dimension
  const availableOrgans = useMemo(
    () => [...new Set(tasks.map((t) => t.organ))].sort(),
    [tasks]
  );

  const availableCategories = useMemo(
    () => [...new Set(tasks.map(getCategoryFn))].filter(Boolean).sort(),
    [tasks, getCategoryFn]
  );

  const availableTaskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  // Initialize filter toggles
  const organs = useSetToggle(availableOrgans);
  const categories = useSetToggle(availableCategories);
  const taskNames = useSetToggle(availableTaskNames);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const search: SearchState = {
    query: searchQuery,
    setQuery: setSearchQuery,
    clearQuery: useCallback(() => setSearchQuery(""), []),
    isActive: enableSearch && searchQuery.trim().length > 0,
  };

  // Filter tasks based on current state
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const isSearching = enableSearch && query.length > 0;

    let result: Task[];

    if (isSearching && searchOverridesFilters) {
      // When searching, search overrides other filters
      const queryWords = query.split(/\s+/);

      result = tasks.filter((task) => {
        const searchText = getSearchableText
          ? getSearchableText(task)
          : buildSearchableText(task, searchFields, getCategoryFn);

        return queryWords.every((word) => searchText.includes(word));
      });
    } else {
      // Apply multi-dimensional filters
      result = tasks.filter((task) => {
        const category = getCategoryFn(task);

        const matchesOrgan = organs.selected.has(task.organ);
        const matchesCategory = categories.selected.has(category);
        const matchesTaskName = taskNames.selected.has(task.name);

        let matches = matchesOrgan && matchesCategory && matchesTaskName;

        // If search is enabled but doesn't override, apply it additionally
        if (isSearching && !searchOverridesFilters) {
          const queryWords = query.split(/\s+/);
          const searchText = getSearchableText
            ? getSearchableText(task)
            : buildSearchableText(task, searchFields, getCategoryFn);

          matches = matches && queryWords.every((word) => searchText.includes(word));
        }

        return matches;
      });
    }

    return result.sort(sortFn);
  }, [
    tasks,
    searchQuery,
    enableSearch,
    searchOverridesFilters,
    organs.selected,
    categories.selected,
    taskNames.selected,
    getSearchableText,
    searchFields,
    getCategoryFn,
    sortFn,
  ]);

  // Reset all filters to default state
  const resetAllFilters = useCallback(() => {
    organs.selectAll();
    categories.selectAll();
    taskNames.selectAll();
    setSearchQuery("");
  }, [organs, categories, taskNames]);

  return {
    filteredTasks,
    organs,
    categories,
    taskNames,
    search,
    resetAllFilters,
    availableOrgans,
    availableCategories,
    availableTaskNames,
  };
}

/**
 * Simplified hook for basic organ + task name filtering (no categories)
 * Used by simpler benchmark tables like HEST, PLISM
 *
 * @param tasks - Array of tasks to filter
 * @returns Filtered tasks and filter controls
 */
export function useSimpleTaskFiltering(tasks: Task[]) {
  const availableOrgans = useMemo(
    () => [...new Set(tasks.map((t) => t.organ))].sort(),
    [tasks]
  );

  const availableTaskNames = useMemo(
    () => [...new Set(tasks.map((t) => t.name))].sort(),
    [tasks]
  );

  const organs = useSetToggle(availableOrgans);
  const taskNames = useSetToggle(availableTaskNames);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => organs.selected.has(t.organ) && taskNames.selected.has(t.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, organs.selected, taskNames.selected]);

  return {
    filteredTasks,
    organs,
    taskNames,
    availableOrgans,
    availableTaskNames,
  };
}
