/**
 * Hooks Module
 *
 * Central export point for all custom React hooks used in Histoboard.
 *
 * @module hooks
 */

export { useSetToggle, useMultipleSetToggles } from "./useSetToggle";
export type { UseSetToggleReturn } from "./useSetToggle";

export {
  useTaskFiltering,
  useSimpleTaskFiltering,
} from "./useTaskFiltering";
export type {
  TaskFilteringConfig,
  SearchState,
  UseTaskFilteringReturn,
} from "./useTaskFiltering";
