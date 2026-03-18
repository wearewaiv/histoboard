/**
 * About Page (/about)
 *
 * Project overview, methodology description, benchmark summaries with links
 * to original publications, and contribution guidelines.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, BookOpen, Database, Trophy, Swords } from "lucide-react";

import benchmarksData from "@/data/benchmarks.json";
import modelsData from "@/data/models.json";
import tasksData from "@/data/tasks.json";

import type { Benchmark, Model, Task } from "@/types";
import { getUniqueGroupedOrgans } from "@/lib/organGroups";

const benchmarks = benchmarksData as Benchmark[];
const models = modelsData as Model[];
const tasks = tasksData as Task[];

const groupedOrgans = getUniqueGroupedOrgans(tasks);

const stats = {
  benchmarkCount: benchmarks.length,
  taskCount: tasks.length,
  modelCount: models.length,
  organs: groupedOrgans,
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center">About Histoboard</h1>

      {/* Motivation Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Why Histoboard?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify">
            Foundation models have transformed computational pathology. Trained on large-scale histopathology datasets
            through self-supervised learning, these models learn general-purpose visual representations from digitized
            tissue slides. Once trained, they can be adapted to a wide range of downstream tasks&mdash;cancer detection
            and grading, biomarker prediction, survival analysis, tissue segmentation&mdash;often matching or exceeding
            task-specific approaches. Beyond purely visual encoders, multi-modal models that integrate additional
            data sources—pathology reports, genomic profiles, clinical metadata—are expanding the scope of what
            foundation models can achieve in this domain.
          </p>
          <p className="text-muted-foreground text-justify">
            As the number of pathology foundation models grows, so does the need for rigorous evaluation. Yet the field
            currently faces a{" "}
            <a
              href="https://www.nature.com/articles/s41591-025-03637-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              benchmarking crisis
            </a>{" "}
            (Mahmood, 2025): the lack of standardized evaluation protocols makes it difficult to reliably assess model
            strengths, robustness, limitations, and readiness for clinical deployment.
          </p>
          <p className="text-muted-foreground text-justify">
            Ideally, the community would converge on a single, comprehensive, publicly available benchmark against which
            all models could be evaluated. We are not there yet. Many benchmarks rely on proprietary or
            restricted-access data, and individual labs often develop their own internal evaluation suites, further
            fragmenting the landscape. Recent community-driven initiatives such as{" "}
            <a
              href="https://huggingface.co/datasets/MahmoodLab/Patho-Bench"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Patho-Bench
            </a>
             {" "}propose clinically relevant tasks built on public datasets and represent important steps toward greater
            transparency, reproducibility, and continued progress (Zhang, 2025).
          </p>
          <p className="text-muted-foreground text-justify">
            Until a unified benchmark emerges, <strong>Histoboard</strong> aims to bridge the gap by aggregating
            results from published benchmarks into a single, accessible interface. Our goal is to provide the community
            with a clear comparative view of existing models and to advocate for more publicly available evaluation
            datasets.
          </p>
          <p className="text-muted-foreground text-justify">
            If you are aware of public benchmarks that should be included, or have suggestions for improving pathology
            model evaluation, we welcome your contributions.
          </p>
        </CardContent>
      </Card>

      {/* What We Aggregate Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What We Aggregate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify">
            Histoboard currently aggregates results from <strong>{stats.benchmarkCount} published benchmarks</strong> covering:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>{stats.taskCount} evaluation tasks</strong> spanning classification, survival prediction, biomarker detection,
              and more
            </li>
            <li>
              <strong>{stats.modelCount} foundation models</strong> from academic and industry labs worldwide
            </li>
            <li>
              <strong>{stats.organs.length} organs</strong> including {stats.organs.slice(0, 5).join(", ")}, and others
            </li>
            <li>
              <strong>Robustness evaluation</strong> across domain shifts, scanners, and staining variations
            </li>
          </ul>
          <p className="text-muted-foreground text-justify">
            All data comes directly from official benchmark publications and repositories. See each{" "}
            <Link href="/benchmarks" className="text-primary hover:underline font-medium">
              benchmark card
            </Link>{" "}
            for exact data sources and evaluation protocols.
          </p>
        </CardContent>
      </Card>

      {/* How Rankings Work Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How Rankings Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify">
            The{" "}
            <Link href="/leaderboard" className="text-primary hover:underline font-medium">
              main leaderboard
            </Link>{" "}
            displays the rankings of each foundation model based on the official benchmarks.
          </p>
          <p className="text-muted-foreground text-justify">
            For detailed per-task results, visit the individual{" "}
            <Link href="/benchmarks" className="text-primary hover:underline font-medium">
              benchmark pages
            </Link>
            . Inside the{" "}
            <Link href="/arena" className="text-primary hover:underline font-medium">
              arena
            </Link>
            , we implement a metric-agnostic ranking system that enables you to compare models based on specific organs and tasks.
          </p>
        </CardContent>
      </Card>

      {/* Contributing Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contributing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify">
            Histoboard is open source and welcomes contributions. If you notice missing models, incorrect data, or want
            to add a new benchmark, please:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/wearewaiv/histoboard/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Github className="mr-2 h-4 w-4" />
                Open an Issue
              </Button>
            </a>
            <a
              href="https://github.com/wearewaiv/histoboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Repository
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Key References Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Key References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm">
                  Mahmood, F. (2025).{" "}
                  <a
                    href="https://www.nature.com/articles/s41591-025-03637-3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    A benchmarking crisis in biomedical machine learning
                  </a>
                  . <em>Nature Medicine</em>, 31, 1060.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm">
                  Zhang, A., Jaume, G., Vaidya, A., Ding, T., & Mahmood, F. (2025).{" "}
                  <a
                    href="https://arxiv.org/abs/2502.06750"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Accelerating Data Processing and Benchmarking of AI Models for Pathology
                  </a>
                  . <em>arXiv:2502.06750</em>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/leaderboard">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Trophy className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Leaderboard</p>
              <p className="text-sm text-muted-foreground">Overall model rankings</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/arena">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Swords className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Arena</p>
              <p className="text-sm text-muted-foreground">Head-to-head comparison</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/benchmarks">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Benchmarks</p>
              <p className="text-sm text-muted-foreground">Detailed per-task results</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/models">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Database className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Models</p>
              <p className="text-sm text-muted-foreground">Browse all foundation models</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
