"use client";

/**
 * Leaderboard Filters Component
 *
 * Renders the filter bar for the leaderboard page. Composes the shared
 * ModelAttributeFilterBar with an additional Models dropdown for
 * individual model selection.
 *
 * @module components/leaderboard/LeaderboardFilters
 */

import React from "react";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { ModelAttributeFilterBar } from "@/components/filters/ModelAttributeFilterBar";
import type { UseLeaderboardFiltersReturn } from "@/hooks/useLeaderboardFilters";

interface LeaderboardFiltersProps {
  filters: UseLeaderboardFiltersReturn;
  allModelCount: number;
}

export function LeaderboardFilters({
  filters,
  allModelCount,
}: LeaderboardFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <ModelAttributeFilterBar filters={filters} size="sm">
        {/* Models Dropdown (leaderboard-specific) */}
        <MultiSelectDropdown
          label="Models"
          size="sm"
          options={filters.sortedModels.map((model) => ({
            id: model.id,
            label: model.name,
          }))}
          selectedIds={filters.selectedModelIds}
          onToggle={filters.toggleModel}
          onSelectAll={filters.selectAllModels}
          onClearAll={filters.clearAllModels}
        />

        <span className="text-xs text-muted-foreground">
          ({filters.effectiveSelectedIds.size}/{allModelCount} models)
        </span>
      </ModelAttributeFilterBar>
    </div>
  );
}
