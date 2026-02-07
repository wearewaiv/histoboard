/**
 * useSetToggle Hook
 *
 * A generic hook for managing Set-based filter state with toggle, select all,
 * and clear all functionality. Commonly used for multi-select filter dropdowns
 * in data tables.
 *
 * @example
 * ```tsx
 * const organs = ['breast', 'lung', 'kidney'];
 * const { selected, toggle, selectAll, clearAll, isSelected } = useSetToggle(organs);
 *
 * // In your component:
 * <MultiSelectDropdown
 *   selectedIds={selected}
 *   onToggle={toggle}
 *   onSelectAll={selectAll}
 *   onClearAll={clearAll}
 * />
 * ```
 */
import { useState, useCallback, useMemo } from "react";

/**
 * Return type for useSetToggle hook
 */
export interface UseSetToggleReturn<T> {
  /** The current Set of selected values */
  selected: Set<T>;
  /** Toggle a single value in/out of the set */
  toggle: (value: T) => void;
  /** Select all values from the initial set */
  selectAll: () => void;
  /** Clear all selected values */
  clearAll: () => void;
  /** Check if a specific value is selected */
  isSelected: (value: T) => boolean;
  /** Set the selection to specific values */
  setSelected: React.Dispatch<React.SetStateAction<Set<T>>>;
  /** Number of currently selected items */
  selectedCount: number;
  /** Total number of available items */
  totalCount: number;
}

/**
 * Hook for managing Set-based toggle state
 *
 * @param initialValues - Array of values to initialize the set with (all selected by default)
 * @param options - Optional configuration
 * @param options.startEmpty - If true, start with empty selection instead of all selected
 * @param options.initialSelection - If provided, use this subset as the initial selection
 * @returns Object containing selection state and manipulation functions
 */
export function useSetToggle<T>(
  initialValues: T[],
  options: { startEmpty?: boolean; initialSelection?: T[] } = {}
): UseSetToggleReturn<T> {
  const { startEmpty = false, initialSelection } = options;

  // Memoize initial values array to prevent recreation
  const allValues = useMemo(() => initialValues, [initialValues]);

  const [selected, setSelected] = useState<Set<T>>(
    () => new Set(initialSelection ?? (startEmpty ? [] : allValues))
  );

  /**
   * Toggle a single value in/out of the selection
   */
  const toggle = useCallback((value: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  /**
   * Select all available values
   */
  const selectAll = useCallback(() => {
    setSelected(new Set(allValues));
  }, [allValues]);

  /**
   * Clear all selections
   */
  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  /**
   * Check if a value is currently selected
   */
  const isSelected = useCallback(
    (value: T) => selected.has(value),
    [selected]
  );

  return {
    selected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    setSelected,
    selectedCount: selected.size,
    totalCount: allValues.length,
  };
}

/**
 * Convenience function to create multiple set toggles at once
 * Useful when a component needs several independent filter states
 *
 * @example
 * ```tsx
 * const filters = useMultipleSetToggles({
 *   organs: ['breast', 'lung'],
 *   categories: ['classification', 'survival'],
 * });
 *
 * // Access individual toggles:
 * filters.organs.toggle('breast');
 * filters.categories.selectAll();
 * ```
 */
export function useMultipleSetToggles<K extends string>(
  config: Record<K, string[]>,
  options: { startEmpty?: boolean } = {}
): Record<K, UseSetToggleReturn<string>> {
  const keys = Object.keys(config) as K[];

  // Create individual toggles for each filter dimension
  // Note: This creates hooks in a loop, which is safe because
  // the config keys are stable across renders
  const toggles = {} as Record<K, UseSetToggleReturn<string>>;

  for (const key of keys) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toggles[key] = useSetToggle(config[key], options);
  }

  return toggles;
}
