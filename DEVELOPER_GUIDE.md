# Developer Guide

This guide helps you get oriented in the Histoboard codebase and explains how to add new features.

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** (comes with Node.js)
- **Python 3.10+** (only if working on the scraper)

### Setup

```bash
git clone https://github.com/wearewaiv/histoboard.git
cd histoboard/frontend
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`. Pages hot-reload on file changes.

### Production Build

```bash
npm run build
```

This runs TypeScript checking and generates a static export in `frontend/out/`. If the build fails, it's usually a TypeScript error — check the terminal output.

### Type Checking (without building)

```bash
npx tsc --noEmit
```

## Codebase Organization

### Import Aliases

All imports use `@/` as an alias for `frontend/src/`:

```typescript
import { cn } from "@/lib/utils";           // → src/lib/utils.ts
import type { Model } from "@/types";        // → src/types/index.ts
import { useSetToggle } from "@/hooks";      // → src/hooks/index.ts
```

### File Naming Conventions

- **Pages**: `app/{route}/page.tsx` (Next.js convention)
- **Components**: PascalCase (e.g., `LeaderboardTable.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSetToggle.ts`)
- **Libraries**: camelCase (e.g., `vegaSpecBuilder.ts`)
- **Types**: `index.ts` for core types, named files for specialized types

### Where Things Live

| I want to... | Look in... |
|---|---|
| Add or modify a page | `app/` |
| Change table rendering | `components/tables/` |
| Modify chart behavior | `components/charts/` + `lib/vegaSpecBuilder.ts` |
| Change filter logic | `hooks/useTaskFiltering.ts` or `hooks/useModelAttributeFilters.ts` |
| Add a utility function | `lib/` (keep it pure — no React imports) |
| Change types | `types/index.ts` |
| Update benchmark data | `data/*.json` |

## Adding a New Benchmark

### Step 1: Add Data

Add entries to the three JSON files in `frontend/src/data/`:

**`benchmarks.json`** — Add a benchmark definition:
```json
{
  "id": "mybench",
  "name": "My Benchmark",
  "shortName": "MyBench",
  "category": ["pathology", "slide-level"],
  "url": "https://github.com/org/mybench",
  "organs": ["breast", "lung"],
  "taskCount": 15,
  "description": "Description of what the benchmark evaluates."
}
```

**`tasks.json`** — Add one entry per evaluation task:
```json
{
  "id": "mybench_task1",
  "benchmarkId": "mybench",
  "name": "Breast Cancer Detection",
  "organ": "breast",
  "metric": "balanced_accuracy",
  "category": "classification"
}
```

**`results.json`** — Add one entry per (model, task) pair:
```json
{
  "modelId": "bioptimus_h_optimus_0",
  "taskId": "mybench_task1",
  "value": 0.872,
  "rank": 3,
  "source": "mybench",
  "retrievedAt": "2025-06-01"
}
```

**`rankings.json`** — Add pre-computed average ranks:
```json
{
  "mybench": {
    "bioptimus_h_optimus_0": { "avgRank": 2.5, "taskCount": 15 },
    "paige_virchow2": { "avgRank": 1.8, "taskCount": 15 }
  }
}
```

### Step 2: Create a Table Component

Create `frontend/src/components/tables/MyBenchDetailedTable.tsx`:

```typescript
"use client";

import React from "react";
import Link from "next/link";
import type { Model, Task, Result } from "@/types";
import { cn, formatNumber, getValueColor } from "@/lib/utils";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useTaskFiltering } from "@/hooks";
import { useDetailedTableData } from "@/hooks/useDetailedTableData";

interface MyBenchDetailedTableProps {
  models: Model[];
  tasks: Task[];
  results: Result[];
  modelRankings: { modelId: string; overallRank: number }[];
}

export function MyBenchDetailedTable({
  models,
  tasks,
  results,
}: MyBenchDetailedTableProps) {
  // Filter tasks by organs, categories, and task names
  const {
    filteredTasks,
    organs,
    categories,
    taskNames,
    availableOrgans,
    availableCategories,
    availableTaskNames,
  } = useTaskFiltering(tasks);

  // Compute rankings, averages, and sort models
  const { resultsMap, taskStats, modelAvgRanks, modelAvgValues, sortedModels } =
    useDetailedTableData({ models, filteredTasks, results });

  return (
    <div>
      {/* Filter dropdowns */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MultiSelectDropdown
          label="Indications"
          options={availableOrgans
            .map((o) => ({ id: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          selectedIds={organs.selected}
          onToggle={organs.toggle}
          onSelectAll={organs.selectAll}
          onClearAll={organs.clearAll}
        />
        {/* Add more dropdowns as needed */}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted">
              <th className="sticky left-0 z-30 bg-muted px-3 py-2 text-left font-semibold min-w-[150px]">
                Model
              </th>
              <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-muted/80">
                <div className="text-xs leading-tight">Average<br />rank</div>
              </th>
              {filteredTasks.map((task) => (
                <th key={task.id} className="px-2 py-2 text-center font-semibold min-w-[100px] bg-muted">
                  <div className="text-xs whitespace-normal leading-tight">{task.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, sortIdx) => {
              const modelResults = resultsMap.get(model.id);
              const hasResults = filteredTasks.some((t) => modelResults?.has(t.id));
              if (!hasResults) return null;
              return (
                <tr key={model.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-background px-3 py-2 border-r">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {sortIdx + 1}
                      </span>
                      <Link href={`/models/${model.id}`} className="font-medium text-primary hover:underline whitespace-nowrap">
                        {model.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums bg-muted/30 font-semibold">
                    {modelAvgRanks.get(model.id) !== undefined
                      ? formatNumber(modelAvgRanks.get(model.id)!, 2)
                      : "-"}
                  </td>
                  {filteredTasks.map((task) => {
                    const value = modelResults?.get(task.id)?.value;
                    return (
                      <td
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums",
                          value !== undefined && getValueColor(value, taskStats.get(task.id))
                        )}
                      >
                        {value !== undefined ? formatNumber(value, 3) : "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 3: Register the Table

In `app/benchmarks/[id]/page.tsx`, import and register the component:

```typescript
import { MyBenchDetailedTable } from "@/components/tables/MyBenchDetailedTable";

const benchmarkTableMap = {
  // ... existing entries
  mybench: MyBenchDetailedTable,
};
```

### Step 4: Update Navigation (if needed)

The benchmarks index page (`app/benchmarks/page.tsx`) auto-renders all entries from `benchmarks.json` — no code change needed.

The leaderboard table (`components/tables/LeaderboardTable.tsx`) also reads from `benchmarks.json`, so the new benchmark appears automatically.

## Adding a New Model

Add an entry to `frontend/src/data/models.json`:

```json
{
  "id": "org_model-name",
  "name": "Model Display Name",
  "organization": "Organization Name",
  "architecture": "ViT-L/16",
  "params": "307M",
  "pretrainingData": "Description of training data sources",
  "wsiDataSize": "100K+ WSIs",
  "imageCaptionDataSize": "N/A",
  "histologyPatchesPretraining": false,
  "publicationDate": "2025-01-15",
  "license": "open-source",
  "publicationType": "peer-reviewed",
  "modelType": "vision",
  "trainingMethod": "DINOv2",
  "paperUrl": "https://arxiv.org/abs/...",
  "blogUrl": "",
  "codeUrl": "https://github.com/...",
  "weightsUrl": "https://huggingface.co/...",
  "datasetUrl": ""
}
```

**ID convention**: `{organization}_{model-name}` in snake_case (e.g., `bioptimus_h_optimus_0`).

Then add the model's results to `results.json` and its rankings to `rankings.json`.

## Adding a New Page

1. Create `frontend/src/app/{page-name}/page.tsx`
2. Export a default component
3. Add navigation entry in `components/layout/Header.tsx`:

```typescript
const navigation = [
  // ... existing entries
  { name: "My Page", href: "/my-page", icon: SomeIcon },
];
```

For dynamic routes, create `app/{route}/[param]/page.tsx` and export `generateStaticParams()`:

```typescript
export function generateStaticParams() {
  return data.map((item) => ({ param: item.id }));
}
```

## Adding a New Hook

1. Create `frontend/src/hooks/useMyHook.ts`
2. Export the hook and its return type
3. Add to the barrel export in `frontend/src/hooks/index.ts`:

```typescript
export { useMyHook } from "./useMyHook";
export type { UseMyHookReturn } from "./useMyHook";
```

## Adding a New Chart

Charts follow the spec builder pattern:

1. **Build data** — Transform raw data into the format the chart needs (in your component or a lib function)
2. **Build spec** — Use pure functions from `lib/vegaSpecBuilder.ts` to create Vega-Lite spec fragments
3. **Render** — Pass the spec to `<VegaChart>`

```typescript
import { VegaChart } from "@/components/charts/VegaChart";
import { baseSpecShell, buildScatterLayer } from "@/lib/vegaSpecBuilder";

function MyChart({ data }) {
  const spec = useMemo(() => ({
    ...baseSpecShell(),
    layer: [
      buildScatterLayer({ /* options */ }),
    ],
    data: { values: data },
  }), [data]);

  return <VegaChart spec={spec} />;
}
```

`VegaChart` handles dynamic import and SSR avoidance. `VegaChartInner` handles container measurement.

## Common Patterns

### Filter State with `useSetToggle`

```typescript
const organs = useSetToggle(availableOrgans);

// Check membership: O(1)
organs.selected.has("breast");  // true/false

// Toggle a value
organs.toggle("breast");

// Bulk operations
organs.selectAll();
organs.clearAll();
```

### Table Cell Coloring with `getValueColor`

```typescript
import { getValueColor } from "@/lib/utils";

// Returns a Tailwind class string based on relative performance
// Green for top performers, red for bottom, gray for middle
const colorClass = getValueColor(value, taskStats.get(task.id));
// → "bg-emerald-100 text-emerald-800" (top 10%)
// → "bg-red-50 text-red-700" (bottom 10%)
```

### Number Formatting

```typescript
import { formatNumber } from "@/lib/utils";

formatNumber(0.87234, 3);  // "0.872"
formatNumber(2.5, 2);      // "2.50"
formatNumber(1234, 0);     // "1,234"
```

## Common Pitfalls

### Vega-Lite: Cannot Vary dx/dy Per Datum

`xOffset`/`yOffset` encoding with `scale: null` does **not** work for raw pixel offsets on continuous axes. To position text labels at different offsets per point, use **multiple filtered layers** (one per direction). See `lib/vegaSpecBuilder.ts` → `buildTextLabelLayers()`.

### Dynamic Import for SSR-Unsafe Libraries

`vega-embed` accesses `window` and cannot run during server-side rendering. Always use dynamic import:

```typescript
const VegaChartInner = dynamic(() => import("./VegaChartInner"), { ssr: false });
```

### useMemo Dependency Arrays

Always list all dependencies. A common mistake is depending on a `.selected` Set but forgetting that `Set` identity doesn't change when `useSetToggle` returns a new `Set` — it always returns a new `Set`, so this works correctly. But if you create a `Set` inline in your render, wrap it in `useMemo`.

### Set Equality in React

React compares by reference, not by value. Two `Set` objects with the same elements are **not equal**. `useSetToggle` handles this correctly (creates a new Set on every mutation). But if you're comparing Sets manually, use size + subset checks.

## Debugging

### Development Server

```bash
npm run dev
```

Open browser DevTools → Console to see React warnings and errors.

### TypeScript Errors

```bash
npx tsc --noEmit
```

Shows all type errors without building.

### Vega-Lite Charts

Open the [Vega-Lite Editor](https://vega.github.io/editor/) and paste your spec JSON to debug chart rendering issues interactively.

### React DevTools

Install the [React DevTools browser extension](https://react.dev/learn/react-developer-tools) to inspect component props, state, and hook values.

## Build & Deploy

### Static Export

The app is configured for static HTML export in `next.config.ts`:

```typescript
const nextConfig = {
  output: "export",              // Generate static files instead of a Node server
  images: { unoptimized: true }, // Required for static export
  basePath: process.env.NODE_ENV === "production" ? "/histoboard" : "",
};
```

### Build Output

```bash
npm run build
# Output: frontend/out/ (static HTML, JS, CSS)
```

### Deployment

The static files in `frontend/out/` are deployed to **GitHub Pages** via the CI workflow. Any static hosting service works (Cloudflare Pages, Netlify, Vercel static export, etc.).

### Base Path

In production, the app is served at `/histoboard`. The `basePath` config handles this automatically. In development, pages are served at the root (`/`).
