import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

import modelsData from "@/data/models.json";

import type { Model } from "@/types";

const models = modelsData as Model[];

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/models" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Models
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{model.name}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{model.organization}</p>
      </div>

      {/* Model Info */}
      <Card>
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-muted-foreground">Architecture</dt>
              <dd className="font-medium">{model.architecture}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Parameters</dt>
              <dd className="font-medium">{model.params}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Pretraining Data</dt>
              <dd className="font-medium">{model.pretrainingData}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Publication Date</dt>
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
    </div>
  );
}
