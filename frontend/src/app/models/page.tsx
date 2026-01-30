"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import modelsData from "@/data/models.json";
import rankingsData from "@/data/rankings.json";

import type { Model, LicenseType, PublicationType, ModelType } from "@/types";

const models = (modelsData as Model[]).sort((a, b) => a.name.localeCompare(b.name));

const LICENSE_OPTIONS: { value: LicenseType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open-source", label: "Open Source" },
  { value: "non-commercial", label: "Non-Commercial" },
  { value: "closed-source", label: "Closed Source" },
];

const PUBLICATION_OPTIONS: { value: PublicationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "peer-reviewed", label: "Peer-reviewed" },
  { value: "preprint", label: "Preprint" },
  { value: "blog", label: "Blog" },
];

const MODEL_TYPE_OPTIONS: { value: ModelType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vision", label: "Vision" },
  { value: "vision-language", label: "Vision-Language" },
];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

const BENCHMARKS = [
  { id: "eva", name: "EVA" },
  { id: "pathbench", name: "PathBench" },
  { id: "stanford", name: "Stanford" },
  { id: "hest", name: "HEST" },
  { id: "pathobench", name: "Patho-Bench" },
  { id: "sinai", name: "Sinai" },
  { id: "stamp", name: "STAMP" },
  { id: "thunder", name: "THUNDER" },
  { id: "pathorob", name: "PathoROB" },
  { id: "plism", name: "PLISM" },
];

function getMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<LicenseType | "all">("all");
  const [publicationFilter, setPublicationFilter] = useState<PublicationType | "all">("all");
  const [modelTypeFilter, setModelTypeFilter] = useState<ModelType | "all">("all");

  // Filter models based on search query and license
  const filteredModels = useMemo(() => {
    let result = models;

    // Filter by license
    if (licenseFilter !== "all") {
      result = result.filter((model) => model.license === licenseFilter);
    }

    // Filter by publication type
    if (publicationFilter !== "all") {
      result = result.filter((model) => model.publicationType === publicationFilter);
    }

    // Filter by model type
    if (modelTypeFilter !== "all") {
      result = result.filter((model) => model.modelType === modelTypeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.organization.toLowerCase().includes(query) ||
          model.architecture.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, licenseFilter, publicationFilter, modelTypeFilter]);

  // Compute integer ranks per benchmark
  const benchmarkRanks = useMemo(() => {
    const result: Record<string, { ranks: Map<string, number>; total: number }> = {};

    for (const benchmark of BENCHMARKS) {
      const benchmarkData = rankings[benchmark.id];
      if (!benchmarkData) continue;

      // Get all models with rankings for this benchmark, sorted by avgRank
      const modelsWithRank = Object.entries(benchmarkData)
        .map(([modelId, data]) => ({ modelId, avgRank: data.avgRank }))
        .sort((a, b) => a.avgRank - b.avgRank);

      const rankMap = new Map<string, number>();
      modelsWithRank.forEach((item, index) => {
        rankMap.set(item.modelId, index + 1);
      });

      result[benchmark.id] = {
        ranks: rankMap,
        total: modelsWithRank.length,
      };
    }

    return result;
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Models</h1>
        <p className="mt-2 text-muted-foreground">
          Browse {models.length} pathology foundation models and their benchmark
          performance
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, organization, or architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">License:</span>
              {LICENSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLicenseFilter(option.value)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md border transition-colors",
                    licenseFilter === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Publication:</span>
              {PUBLICATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPublicationFilter(option.value)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md border transition-colors",
                    publicationFilter === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Type:</span>
              {MODEL_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setModelTypeFilter(option.value)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md border transition-colors",
                    modelTypeFilter === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map((model) => {
          // Check if model has any benchmark rankings
          const hasRankings = BENCHMARKS.some(
            (b) => benchmarkRanks[b.id]?.ranks.has(model.id)
          );

          return (
            <Card key={model.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {model.organization}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {model.license && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          model.license === "open-source" && "bg-green-500/20 border-green-500 text-green-700",
                          model.license === "non-commercial" && "bg-yellow-500/20 border-yellow-500 text-yellow-700",
                          model.license === "closed-source" && "bg-red-500/20 border-red-500 text-red-700"
                        )}
                      >
                        {model.license === "open-source" && "Open Source"}
                        {model.license === "non-commercial" && "Non-Commercial"}
                        {model.license === "closed-source" && "Closed Source"}
                      </Badge>
                    )}
                    {model.publicationType && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          model.publicationType === "peer-reviewed" && "bg-blue-500/20 border-blue-500 text-blue-700",
                          model.publicationType === "preprint" && "bg-purple-500/20 border-purple-500 text-purple-700",
                          model.publicationType === "blog" && "bg-orange-500/20 border-orange-500 text-orange-700"
                        )}
                      >
                        {model.publicationType === "peer-reviewed" && "Peer-reviewed"}
                        {model.publicationType === "preprint" && "Preprint"}
                        {model.publicationType === "blog" && "Blog"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Architecture</dt>
                    <dd className="font-medium">{model.architecture}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Parameters</dt>
                    <dd className="font-medium">{model.params}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Training Data</dt>
                    <dd className="font-medium text-right max-w-[60%] truncate">
                      {model.pretrainingData}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Release Date</dt>
                    <dd className="font-medium">{model.publicationDate}</dd>
                  </div>
                </dl>

                {/* Benchmark Rankings */}
                {hasRankings && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Benchmark Rankings</p>
                    <div className="flex flex-wrap gap-2">
                      {BENCHMARKS.map((benchmark) => {
                        const data = benchmarkRanks[benchmark.id];
                        if (!data) return null;

                        const rank = data.ranks.get(model.id);
                        if (rank === undefined) return null;

                        const medal = getMedal(rank);

                        return (
                          <Badge
                            key={benchmark.id}
                            variant="outline"
                            className={cn(
                              rank === 1 && "bg-yellow-500/20 border-yellow-500",
                              rank === 2 && "bg-gray-400/20 border-gray-400",
                              rank === 3 && "bg-amber-600/20 border-amber-600"
                            )}
                          >
                            {medal && <span className="mr-1">{medal}</span>}
                            {benchmark.name}: {rank}/{data.total}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {model.paperUrl && (
                    <a
                      href={model.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Paper
                      </Badge>
                    </a>
                  )}
                  {model.blogUrl && (
                    <a
                      href={model.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Blog
                      </Badge>
                    </a>
                  )}
                  {model.codeUrl && (
                    <a
                      href={model.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Code
                      </Badge>
                    </a>
                  )}
                  {model.weightsUrl && (
                    <a
                      href={model.weightsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Weights
                      </Badge>
                    </a>
                  )}
                  {model.datasetUrl && (
                    <a
                      href={model.datasetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="cursor-pointer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Dataset
                      </Badge>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
