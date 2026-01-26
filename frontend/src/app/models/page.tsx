"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeModelRankings } from "@/lib/ranking";
import { ExternalLink, ArrowRight } from "lucide-react";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";

import type { Model, Task, Result } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];

export default function ModelsPage() {
  const rankings = computeModelRankings(models, tasks, results);
  const rankingMap = new Map(rankings.map((r) => [r.modelId, r]));

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
          const ranking = rankingMap.get(model.id);
          return (
            <Card key={model.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {model.organization}
                    </p>
                  </div>
                  {ranking && (
                    <Badge
                      variant={ranking.overallRank <= 3 ? "default" : "secondary"}
                    >
                      #{ranking.overallRank}
                    </Badge>
                  )}
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
                  {ranking && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Mean Rank</dt>
                        <dd className="font-medium">
                          {ranking.meanRank.toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tasks Evaluated</dt>
                        <dd className="font-medium">{ranking.tasksEvaluated}</dd>
                      </div>
                    </>
                  )}
                </dl>

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
