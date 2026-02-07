/**
 * Hook that derives a human-readable axis label from a benchmark selection.
 *
 * Rules:
 *  - 0 selected: returns `fallback` (defaults to `prefix`)
 *  - 1–2 selected: returns `"prefix (Label1, Label2)"`
 *  - 3+ selected: returns `"prefix (N benchmarks)"`
 *
 * @module hooks/useBenchmarkAxisLabel
 */
import { useMemo } from "react";

export function useBenchmarkAxisLabel(
  allBenchmarks: ReadonlyArray<{ id: string; label: string }>,
  selectedIds: Set<string>,
  prefix: string,
  fallback?: string,
): string {
  return useMemo(() => {
    const count = selectedIds.size;
    if (count === 0) return fallback ?? prefix;
    if (count <= 2) {
      const names = allBenchmarks
        .filter((b) => selectedIds.has(b.id))
        .map((b) => b.label);
      return `${prefix} (${names.join(", ")})`;
    }
    return `${prefix} (${count} benchmarks)`;
  }, [allBenchmarks, selectedIds, prefix, fallback]);
}
