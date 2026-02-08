/**
 * Model Detail Page (/models/[id])
 *
 * Profile page for a single foundation model. Shows metadata (architecture,
 * params, license, training data), publication links, and per-benchmark
 * ranking badges with medal icons for top-3 placements.
 * Pre-rendered at build time via generateStaticParams.
 */

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

import modelsData from "@/data/models.json";
import rankingsData from "@/data/rankings.json";

import type { Model } from "@/types";

const models = modelsData as Model[];
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
  { id: "plism", name: "Plismbench" },
];

function getMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// Compute integer ranks per benchmark
function getBenchmarkRanks() {
  const result: Record<string, { ranks: Map<string, number>; total: number }> = {};

  for (const benchmark of BENCHMARKS) {
    const benchmarkData = rankings[benchmark.id];
    if (!benchmarkData) continue;

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
}

export function generateStaticParams() {
  return models.map((model) => ({
    id: model.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { id: modelId } = await params;

  const model = models.find((m) => m.id === modelId);
  const benchmarkRanks = getBenchmarkRanks();

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Model not found</p>
            <Link href="/models" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Models
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if model has any benchmark rankings
  const hasRankings = BENCHMARKS.some(
    (b) => benchmarkRanks[b.id]?.ranks.has(model.id)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/models" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Models
      </Link>

      {/* Header with badges */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{model.name}</h1>
            <p className="mt-1 text-lg text-muted-foreground">{model.organization}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {model.license && (
              <Badge
                variant="outline"
                className={cn(
                  "text-sm",
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
                  "text-sm",
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
      </div>

      {/* Model Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Architecture</dt>
              <dd className="font-medium">{model.architecture}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Parameters</dt>
              <dd className="font-medium">{model.params}</dd>
            </div>
            {model.trainingMethod && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Training Method</dt>
                <dd className="font-medium">{model.trainingMethod}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Training Data</dt>
              <dd className="font-medium text-right max-w-[60%]">{model.pretrainingData}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Release Date</dt>
              <dd className="font-medium">{model.publicationDate}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {model.paperUrl && (
              <a href={model.paperUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Paper
                </Button>
              </a>
            )}
            {model.blogUrl && (
              <a href={model.blogUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Blog
                </Button>
              </a>
            )}
            {model.codeUrl && (
              <a href={model.codeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Code
                </Button>
              </a>
            )}
            {model.weightsUrl && (
              <a href={model.weightsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Weights
                </Button>
              </a>
            )}
            {model.datasetUrl && (
              <a href={model.datasetUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Dataset
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Rankings */}
      {hasRankings && (
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Rankings</CardTitle>
          </CardHeader>
          <CardContent>
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
                      "text-sm py-1.5 px-3",
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
