"use client";

import React from "react";
import type { FilterState, BenchmarkCategory, Benchmark } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface FilterPanelProps {
  filters: FilterState;
  benchmarks: Benchmark[];
  availableOrgans: string[];
  onToggleCategory: (category: BenchmarkCategory) => void;
  onToggleOrgan: (organ: string) => void;
  onToggleBenchmark: (benchmark: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const CATEGORIES: { value: BenchmarkCategory; label: string }[] = [
  { value: "patch-level", label: "Patch-Level" },
  { value: "slide-level", label: "Slide-Level" },
  { value: "survival", label: "Survival" },
  { value: "segmentation", label: "Segmentation" },
  { value: "retrieval", label: "Retrieval" },
  { value: "robustness", label: "Robustness" },
];

export function FilterPanel({
  filters,
  benchmarks,
  availableOrgans,
  onToggleCategory,
  onToggleOrgan,
  onToggleBenchmark,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Task Category</h4>
          <div className="space-y-2">
            {CATEGORIES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${value}`}
                  checked={filters.categories.includes(value)}
                  onCheckedChange={() => onToggleCategory(value)}
                />
                <label
                  htmlFor={`category-${value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Organ</h4>
          <div className="space-y-2">
            {availableOrgans.map((organ) => (
              <div key={organ} className="flex items-center space-x-2">
                <Checkbox
                  id={`organ-${organ}`}
                  checked={filters.organs.includes(organ)}
                  onCheckedChange={() => onToggleOrgan(organ)}
                />
                <label
                  htmlFor={`organ-${organ}`}
                  className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {organ}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Benchmark Source</h4>
          <div className="space-y-2">
            {benchmarks.map((benchmark) => (
              <div key={benchmark.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`benchmark-${benchmark.id}`}
                  checked={filters.benchmarks.includes(benchmark.id)}
                  onCheckedChange={() => onToggleBenchmark(benchmark.id)}
                />
                <label
                  htmlFor={`benchmark-${benchmark.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {benchmark.shortName}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
