"use client";

/**
 * Timeline Page (/timeline)
 *
 * Chronological visualization of foundation model releases. Displays models
 * on a vertical timeline grouped by year, with metadata badges and links.
 */

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import modelsData from "@/data/models.json";

import type { Model } from "@/types";

const models = modelsData as Model[];

// Training methods that are considered VLM-style
const VLM_TRAINING_METHODS = [
  "CLIP",
  "CoCa, iBOT",
  "CoCa, BEiT-3",
  "iBOT, CoCa",
  "Contrastive (custom)",
];

const TRAINING_METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  DINOv2: { bg: "bg-blue-500/10", text: "text-blue-700" },
  "DINOv2 (distillation)": { bg: "bg-blue-400/10", text: "text-blue-600" },
  DINO: { bg: "bg-sky-500/10", text: "text-sky-700" },
  iBOT: { bg: "bg-purple-500/10", text: "text-purple-700" },
  SRCL: { bg: "bg-teal-500/10", text: "text-teal-700" },
};

function isVLMModel(model: Model): boolean {
  return (
    model.modelType === "vision-language" ||
    VLM_TRAINING_METHODS.includes(model.trainingMethod || "")
  );
}

function getTrainingMethodColors(method?: string): { bg: string; text: string } {
  if (!method) return { bg: "bg-gray-400/10", text: "text-gray-600" };
  return TRAINING_METHOD_COLORS[method] || { bg: "bg-gray-400/10", text: "text-gray-600" };
}

interface TimelineEntry {
  year: number;
  month: number;
  date: string;
  models: Model[];
}

export default function TimelinePage() {
  // Group models by publication date and sort chronologically
  const timelineData = useMemo(() => {
    const grouped = new Map<string, Model[]>();

    models.forEach((model) => {
      const date = model.publicationDate;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(model);
    });

    // Convert to array and sort by date
    const entries: TimelineEntry[] = Array.from(grouped.entries())
      .map(([date, modelList]) => {
        const [year, month] = date.split("-").map(Number);
        return {
          year,
          month,
          date,
          models: modelList.sort((a, b) => a.name.localeCompare(b.name)),
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return entries;
  }, []);

  // Count VLM models (including VLM-style training methods)
  const vlmCount = useMemo(() => {
    return models.filter((m) => isVLMModel(m)).length;
  }, []);

  // Group entries by year for display
  const entriesByYear = useMemo(() => {
    const byYear = new Map<number, TimelineEntry[]>();
    timelineData.forEach((entry) => {
      if (!byYear.has(entry.year)) {
        byYear.set(entry.year, []);
      }
      byYear.get(entry.year)!.push(entry);
    });
    return byYear;
  }, [timelineData]);

  const years = Array.from(entriesByYear.keys()).sort((a, b) => b - a);

  const formatMonth = (month: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[month - 1] || "Unknown";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Timeline</h1>
        <p className="mt-2 text-muted-foreground">
          Chronological view of {models.length} pathology foundation models
        </p>
      </div>

      {/* Summary stats */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{models.length}</p>
              <p className="text-sm text-muted-foreground">Total Models</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{models.length - vlmCount}</p>
              <p className="text-sm text-muted-foreground">Pathology VMs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{vlmCount}</p>
              <p className="text-sm text-muted-foreground">Pathology VLMs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{years.length}</p>
              <p className="text-sm text-muted-foreground">Years Covered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {new Set(models.map((m) => m.organization)).size}
              </p>
              <p className="text-sm text-muted-foreground">Organizations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {years.map((year) => (
          <div key={year} className="mb-12">
            {/* Year marker */}
            <div className="sticky top-20 z-10 mb-6">
              <div className="inline-flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                {year}
              </div>
            </div>

            {/* Timeline line */}
            <div className="relative ml-4 pl-8 border-l-2 border-muted-foreground/20">
              {entriesByYear.get(year)?.map((entry) => (
                <div key={entry.date} className="mb-8 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-primary border-4 border-background" />

                  {/* Month label */}
                  <div className="absolute -left-[90px] text-sm font-medium text-muted-foreground w-12 text-right">
                    {formatMonth(entry.month)}
                  </div>

                  {/* Models for this date */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {entry.models.map((model) => {
                      const modelIsVLM = isVLMModel(model);

                      return (
                        <Link
                          key={model.id}
                          href={`/models/${model.id}`}
                          className="block"
                        >
                          <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-sm leading-tight">
                                  {model.name}
                                </h3>
                                {modelIsVLM ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-indigo-500/10 border-indigo-500/50 text-indigo-700 flex-shrink-0"
                                  >
                                    VLM
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs flex-shrink-0 border-transparent",
                                      getTrainingMethodColors(model.trainingMethod).bg,
                                      getTrainingMethodColors(model.trainingMethod).text
                                    )}
                                  >
                                    {model.trainingMethod || "Unknown"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {model.organization}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {model.architecture}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {model.params}
                                </Badge>
                                {model.license && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      model.license === "open-source" &&
                                        "bg-green-500/10 border-green-500/50 text-green-700",
                                      model.license === "non-commercial" &&
                                        "bg-yellow-500/10 border-yellow-500/50 text-yellow-700",
                                      model.license === "closed-source" &&
                                        "bg-red-500/10 border-red-500/50 text-red-700"
                                    )}
                                  >
                                    {model.license === "open-source" && "Open"}
                                    {model.license === "non-commercial" && "NC"}
                                    {model.license === "closed-source" && "Closed"}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
