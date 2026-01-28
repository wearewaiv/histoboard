"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

import modelsData from "@/data/models.json";
import rankingsData from "@/data/rankings.json";

import type { Model } from "@/types";

const models = modelsData as Model[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

export default function ModelsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Models</h1>
        <p className="mt-2 text-muted-foreground">
          Browse {models.length} pathology foundation models and their benchmark
          performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => {
          const evaRanking = rankings.eva?.[model.id];
          const pathbenchRanking = rankings.pathbench?.[model.id];

          return (
            <Card key={model.id} className="flex flex-col">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {model.organization}
                  </p>
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
                </dl>

                {/* Benchmark Rankings */}
                {(evaRanking || pathbenchRanking || rankings.stanford?.[model.id] || rankings.hest?.[model.id] || rankings.pathobench?.[model.id] || rankings.sinai?.[model.id] || rankings.stamp?.[model.id] || rankings.thunder?.[model.id] || rankings.pathorob?.[model.id] || rankings.plism?.[model.id]) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Benchmark Rankings</p>
                    <div className="flex flex-wrap gap-2">
                      {evaRanking && (
                        <Badge variant="outline">
                          EVA: {evaRanking.avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {pathbenchRanking && (
                        <Badge variant="outline">
                          PathBench: {pathbenchRanking.avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.stanford?.[model.id] && (
                        <Badge variant="outline">
                          Stanford: {rankings.stanford[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.hest?.[model.id] && (
                        <Badge variant="outline">
                          HEST: {rankings.hest[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.pathobench?.[model.id] && (
                        <Badge variant="outline">
                          Patho-Bench: {rankings.pathobench[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.sinai?.[model.id] && (
                        <Badge variant="outline">
                          Sinai: {rankings.sinai[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.stamp?.[model.id] && (
                        <Badge variant="outline">
                          STAMP: {rankings.stamp[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.thunder?.[model.id] && (
                        <Badge variant="outline">
                          THUNDER: {rankings.thunder[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.pathorob?.[model.id] && (
                        <Badge variant="outline">
                          PathoROB: {rankings.pathorob[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
                      {rankings.plism?.[model.id] && (
                        <Badge variant="outline">
                          PLISM: {rankings.plism[model.id].avgRank.toFixed(2)}
                        </Badge>
                      )}
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
                </div>

                <div className="mt-auto pt-4">
                  <Link href={`/models/${model.id}`}>
                    <Button variant="ghost" className="w-full">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
