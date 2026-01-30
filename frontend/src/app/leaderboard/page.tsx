"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { LeaderboardTable } from "@/components/tables/LeaderboardTable";
import { DetailedResultsTable } from "@/components/tables/DetailedResultsTable";
import { PathBenchDetailedTable } from "@/components/tables/PathBenchDetailedTable";
import { StanfordDetailedTable } from "@/components/tables/StanfordDetailedTable";
import { HESTDetailedTable } from "@/components/tables/HESTDetailedTable";
import { PathoBenchDetailedTable } from "@/components/tables/PathoBenchDetailedTable";
import { SinaiDetailedTable } from "@/components/tables/SinaiDetailedTable";
import { STAMPDetailedTable } from "@/components/tables/STAMPDetailedTable";
import { THUNDERDetailedTable } from "@/components/tables/THUNDERDetailedTable";
import { PathoROBDetailedTable } from "@/components/tables/PathoROBDetailedTable";
import { PLISMDetailedTable } from "@/components/tables/PLISMDetailedTable";

import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";
import resultsData from "@/data/results.json";
import benchmarksData from "@/data/benchmarks.json";
import rankingsData from "@/data/rankings.json";

import type { Model, Task, Result, Benchmark } from "@/types";

const models = modelsData as Model[];
const tasks = tasksData as Task[];
const results = resultsData as Result[];
const benchmarks = benchmarksData as Benchmark[];
const rankings = rankingsData as Record<string, Record<string, { avgRank: number; taskCount: number }>>;

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Create a map for quick model lookup
  const modelMap = useMemo(() => new Map(models.map((m) => [m.id, m])), []);

  // Collect per-benchmark average ranks for each model
  const modelRankings = useMemo(() => {
    const rankingsList: { modelId: string; eva?: number; pathbench?: number; stanford?: number; hest?: number; pathobench?: number; sinai?: number; stamp?: number; thunder?: number; pathorob?: number; plism?: number; benchmarkCount: number }[] = [];

    for (const model of models) {
      const evaRank = rankings.eva?.[model.id]?.avgRank;
      const pathbenchRank = rankings.pathbench?.[model.id]?.avgRank;
      const stanfordRank = rankings.stanford?.[model.id]?.avgRank;
      const hestRank = rankings.hest?.[model.id]?.avgRank;
      const pathobenchRank = rankings.pathobench?.[model.id]?.avgRank;
      const sinaiRank = rankings.sinai?.[model.id]?.avgRank;
      const stampRank = rankings.stamp?.[model.id]?.avgRank;
      const thunderRank = rankings.thunder?.[model.id]?.avgRank;
      const pathorobRank = rankings.pathorob?.[model.id]?.avgRank;
      const plismRank = rankings.plism?.[model.id]?.avgRank;

      const benchmarkCount =
        (evaRank !== undefined ? 1 : 0) +
        (pathbenchRank !== undefined ? 1 : 0) +
        (stanfordRank !== undefined ? 1 : 0) +
        (hestRank !== undefined ? 1 : 0) +
        (pathobenchRank !== undefined ? 1 : 0) +
        (sinaiRank !== undefined ? 1 : 0) +
        (stampRank !== undefined ? 1 : 0) +
        (thunderRank !== undefined ? 1 : 0) +
        (pathorobRank !== undefined ? 1 : 0) +
        (plismRank !== undefined ? 1 : 0);

      if (benchmarkCount > 0) {
        rankingsList.push({
          modelId: model.id,
          eva: evaRank,
          pathbench: pathbenchRank,
          stanford: stanfordRank,
          hest: hestRank,
          pathobench: pathobenchRank,
          sinai: sinaiRank,
          stamp: stampRank,
          thunder: thunderRank,
          pathorob: pathorobRank,
          plism: plismRank,
          benchmarkCount,
        });
      }
    }

    return rankingsList;
  }, []);

  // Filter rankings based on search query
  const filteredModelRankings = useMemo(() => {
    if (!searchQuery.trim()) {
      return modelRankings;
    }

    const query = searchQuery.toLowerCase();
    return modelRankings.filter((ranking) => {
      const model = modelMap.get(ranking.modelId);
      if (!model) return false;
      return (
        model.name.toLowerCase().includes(query) ||
        model.organization.toLowerCase().includes(query) ||
        model.architecture.toLowerCase().includes(query)
      );
    });
  }, [modelRankings, searchQuery, modelMap]);

  // Compute integer ranks per benchmark for detail tables
  const evaModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.eva !== undefined)
      .sort((a, b) => a.eva! - b.eva!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathbenchModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathbench !== undefined)
      .sort((a, b) => a.pathbench! - b.pathbench!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const stanfordModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.stanford !== undefined)
      .sort((a, b) => a.stanford! - b.stanford!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const hestModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.hest !== undefined)
      .sort((a, b) => a.hest! - b.hest!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathobenchModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathobench !== undefined)
      .sort((a, b) => a.pathobench! - b.pathobench!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const sinaiModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.sinai !== undefined)
      .sort((a, b) => a.sinai! - b.sinai!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const stampModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.stamp !== undefined)
      .sort((a, b) => a.stamp! - b.stamp!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const thunderModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.thunder !== undefined)
      .sort((a, b) => a.thunder! - b.thunder!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const pathorobModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.pathorob !== undefined)
      .sort((a, b) => a.pathorob! - b.pathorob!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  const plismModelRankings = useMemo(() => {
    return modelRankings
      .filter(r => r.plism !== undefined)
      .sort((a, b) => a.plism! - b.plism!)
      .map((r, index) => ({ modelId: r.modelId, overallRank: index + 1 }));
  }, [modelRankings]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Compare pathology foundation models across benchmarks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rankings">
            <TabsList className="flex-wrap">
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
              <TabsTrigger value="eva-details">EVA</TabsTrigger>
              <TabsTrigger value="pathbench-details">PathBench</TabsTrigger>
              <TabsTrigger value="stanford-details">Stanford</TabsTrigger>
              <TabsTrigger value="hest-details">HEST</TabsTrigger>
              <TabsTrigger value="pathobench-details">Patho-Bench</TabsTrigger>
              <TabsTrigger value="sinai-details">Sinai</TabsTrigger>
              <TabsTrigger value="stamp-details">STAMP</TabsTrigger>
              <TabsTrigger value="thunder-details">THUNDER</TabsTrigger>
              <TabsTrigger value="pathorob-details">PathoROB</TabsTrigger>
              <TabsTrigger value="plism-details">PLISM</TabsTrigger>
            </TabsList>

            <TabsContent value="rankings">
              <p className="mb-4 text-sm text-muted-foreground">
                Click column headers to sort. Rankings are taken directly from the official benchmarks and serve as the reference. For each benchmark and model, we also provide the average ranking across the corresponding tasks. &quot;-&quot; indicates the model was not evaluated on that benchmark.
              </p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search models by name, organization, or architecture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <LeaderboardTable
                modelRankings={filteredModelRankings}
                models={models}
                benchmarks={benchmarks}
              />
            </TabsContent>

            <TabsContent value="eva-details">
              <p className="mb-4 text-sm text-muted-foreground">
                EVA evaluates FMs on a variety of WSI classification &amp; segmentation tasks.
                It reports Balanced Accuracy for binary &amp; multiclass tasks and Dice Score (without background) for segmentation tasks.
                Scores show the average performance over 5 runs for patch-level classification &amp; segmentation tasks, and 20 runs for slide-level (due to higher standard deviation among runs).
                Colors indicate relative performance (green = best, red = worst).
                Note: There are discrepancies between the average values computed here and those reported by EVA (e.g., they report 0.798 for Virchow2 but the correct average without BACH is 0.815).
              </p>
              <DetailedResultsTable
                models={models.filter(m => rankings.eva?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "eva")}
                results={results.filter(r => r.source === "eva")}
                modelRankings={evaModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathbench-details">
              <PathBenchDetailedTable
                models={models.filter(m => rankings.pathbench?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathbench")}
                results={results.filter(r => r.source === "pathbench")}
                modelRankings={pathbenchModelRankings}
              />
            </TabsContent>

            <TabsContent value="stanford-details">
              <StanfordDetailedTable
                models={models.filter(m => rankings.stanford?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "stanford")}
                results={results.filter(r => r.source === "stanford") as any}
                modelRankings={stanfordModelRankings}
              />
            </TabsContent>

            <TabsContent value="hest-details">
              <HESTDetailedTable
                models={models.filter(m => rankings.hest?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "hest")}
                results={results.filter(r => r.source === "hest")}
                modelRankings={hestModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathobench-details">
              <p className="mb-4 text-sm text-muted-foreground">
                Patho-Bench results from Mahmood Lab showing C-Index values across molecular prediction,
                TME characterization, grading, survival, and treatment response tasks.
              </p>
              <PathoBenchDetailedTable
                models={models.filter(m => rankings.pathobench?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathobench")}
                results={results.filter(r => r.source === "pathobench")}
                modelRankings={pathobenchModelRankings}
              />
            </TabsContent>

            <TabsContent value="sinai-details">
              <p className="mb-4 text-sm text-muted-foreground">
                Sinai SSL Tile Benchmarks results showing AUC values across cancer detection and biomarker prediction tasks.
                Values reported as mean ± std over 20 MCCV splits.
              </p>
              <SinaiDetailedTable
                models={models.filter(m => rankings.sinai?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "sinai")}
                results={results.filter(r => r.source === "sinai") as any}
                modelRankings={sinaiModelRankings}
              />
            </TabsContent>

            <TabsContent value="stamp-details">
              <p className="mb-4 text-sm text-muted-foreground">
                STAMP benchmark from Nature Biomedical Engineering showing AUROC values for weakly supervised
                slide-level classification across morphology, biomarker, and prognosis tasks.
              </p>
              <STAMPDetailedTable
                models={models.filter(m => rankings.stamp?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "stamp")}
                results={results.filter(r => r.source === "stamp")}
                modelRankings={stampModelRankings}
              />
            </TabsContent>

            <TabsContent value="thunder-details">
              <p className="mb-4 text-sm text-muted-foreground">
                THUNDER benchmark evaluating pathology foundation models across KNN classification, linear probing,
                few-shot learning, segmentation, calibration, and adversarial robustness tasks. Rankings are based on rank-sum.
              </p>
              <THUNDERDetailedTable
                models={models.filter(m => rankings.thunder?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "thunder")}
                results={results.filter(r => r.source === "thunder")}
                modelRankings={thunderModelRankings}
              />
            </TabsContent>

            <TabsContent value="pathorob-details">
              <p className="mb-4 text-sm text-muted-foreground">
                PathoROB benchmark evaluating robustness to domain shifts across TCGA 2x2 splits, Camelyon breast cancer,
                and Tolkach esophageal cancer datasets. Higher robustness index indicates better generalization.
              </p>
              <PathoROBDetailedTable
                models={models.filter(m => rankings.pathorob?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "pathorob")}
                results={results.filter(r => r.source === "pathorob")}
                modelRankings={pathorobModelRankings}
              />
            </TabsContent>

            <TabsContent value="plism-details">
              <p className="mb-4 text-sm text-muted-foreground">
                PLISM benchmark from Owkin evaluating embedding consistency across scanner and staining variations.
                Metrics include cosine similarity and top-10 retrieval accuracy for cross-domain robustness.
              </p>
              <PLISMDetailedTable
                models={models.filter(m => rankings.plism?.[m.id])}
                tasks={tasks.filter(t => t.benchmarkId === "plism")}
                results={results.filter(r => r.source === "plism")}
                modelRankings={plismModelRankings}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
