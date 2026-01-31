# Histoboard

A centralized dashboard aggregating benchmark results to compare pathology foundation models using rank-based comparisons.

**Live Demo:** [https://afiliot.github.io/histoboard](https://afiliot.github.io/histoboard)

## Overview

Histoboard provides a unified view of pathology foundation model performance across **10 benchmarks**, **69 models**, and **400+ evaluation tasks**. It enables researchers and practitioners to make informed decisions when selecting models for computational pathology applications.

## Features

- **Unified Leaderboard**: Compare 69 pathology foundation models across 10 benchmarks
- **Rank-Based Comparison**: Fair comparison using mean rank aggregation methodology
- **Detailed Results**: Per-task performance breakdown with color-coded heatmaps
- **Advanced Filtering**: Filter by task category, organ, and benchmark source
- **Model Profiles**: Comprehensive model information including architecture, parameters, and links to papers/weights
- **Robustness Metrics**: Dedicated benchmarks for evaluating model robustness to domain shifts

## Benchmarks Integrated

| Benchmark | Category | Tasks | Models | Description |
|-----------|----------|-------|--------|-------------|
| [EVA](https://kaiko.ai/benchmarks/eva) | Pathology | 13 | 15 | Patch-level classification, slide-level analysis, segmentation |
| [PathBench](https://github.com/birkhoffkiki/PathBench) | Pathology | 229 | 21 | Classification, OS/DFS/DSS prediction across 12 organs |
| [Stanford](https://pathbench.stanford.edu) | Pathology | 41 | 31 | TCGA, CPTAC, and external dataset evaluation |
| [HEST](https://github.com/mahmoodlab/HEST) | Spatial Transcriptomics | 9 | 14 | Gene expression prediction from H&E images |
| [Patho-Bench](https://github.com/mahmoodlab/Patho-Bench) | Pathology | 45 | 5 | Molecular prediction, TME, grading, survival, treatment response |
| [Sinai](https://github.com/sinai-computational-pathology/SSL_tile_benchmarks) | Pathology | 22 | 11 | Cancer detection and biomarker prediction |
| [STAMP](https://www.nature.com/articles/s41551-025-01516-3) | Pathology | 31 | 15 | Weakly supervised slide-level classification |
| [THUNDER](https://github.com/MICS-Lab/thunder) | Pathology | 6 | 31 | KNN, linear probing, few-shot, segmentation, calibration, adversarial |
| [PathoROB](https://github.com/bifold-pathomics/PathoROB) | Robustness | 3 | 20 | Domain shift robustness evaluation |
| [PLISM](https://github.com/owkin/plism-benchmark) | Robustness | 4 | 15 | Scanner and staining variation robustness |

## Top Models (as of January 2025)

Based on aggregate performance across benchmarks:

| Model | Organization | Key Strengths |
|-------|--------------|---------------|
| Virchow2 | Paige AI | Top performer on EVA, Stanford, PathoROB |
| UNI2-H | Harvard/MGH | Best on PathBench, THUNDER; strong overall |
| H-optimus-0 | Bioptimus | Consistent top-5 across most benchmarks |
| CONCH | Harvard/MGH | Excellent on STAMP, PLISM robustness |
| H0-mini | Bioptimus | Best on PLISM; strong robustness |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Charts | Recharts |
| Data | Static JSON (pre-processed) |
| Hosting | GitHub Pages |

## Project Structure

```
histoboard/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Pages (home, leaderboard, models, benchmarks)
│   │   ├── components/         # React components
│   │   │   ├── tables/         # Detailed benchmark tables
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── data/               # Static JSON data
│   │   │   ├── models.json     # 69 model definitions
│   │   │   ├── tasks.json      # 400+ task definitions
│   │   │   ├── results.json    # Performance results
│   │   │   ├── benchmarks.json # Benchmark metadata
│   │   │   └── rankings.json   # Pre-computed rankings
│   │   ├── types/              # TypeScript definitions
│   │   └── lib/                # Utilities
│   └── package.json
│
├── scraper/                    # Python data collection (optional)
│   └── ...
│
└── .github/workflows/          # CI/CD
    └── deploy.yml              # GitHub Pages deployment
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/afiliot/histoboard.git
cd histoboard/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

### Building for Production

```bash
cd frontend
npm run build
```

Static files will be generated in `frontend/out/`.

## Ranking Methodology

Models are ranked using **mean rank aggregation**:

1. For each task within a benchmark, models are ranked by performance (1 = best)
2. Ties are handled using average rank assignment
3. The mean rank across all tasks determines the benchmark ranking
4. Lower mean rank indicates better overall performance

This approach provides fair comparison across tasks with different metrics and scales.

## Adding New Benchmarks

To add a new benchmark:

1. Add benchmark metadata to `frontend/src/data/benchmarks.json`
2. Add task definitions to `frontend/src/data/tasks.json`
3. Add model results to `frontend/src/data/results.json`
4. Compute and add rankings to `frontend/src/data/rankings.json`
5. Create a detailed table component in `frontend/src/components/tables/`
6. Update the leaderboard page to include the new tab

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs or request features via [Issues](https://github.com/afiliot/histoboard/issues)
- Submit benchmark data updates via Pull Requests
- Suggest new benchmarks to integrate

## Citation

If you use Histoboard in your research, please cite:

```bibtex
@misc{histoboard2025,
  title={Histoboard: A Unified Dashboard for Pathology Foundation Model Benchmarks},
  author={...},
  year={2025},
  url={https://afiliot.github.io/histoboard}
}
```

## Acknowledgments

This project aggregates data from multiple benchmark sources. Please cite the original benchmark papers when using their data:

- EVA: [kaiko.ai](https://kaiko.ai/benchmarks/eva)
- PathBench: [Ma et al.](https://github.com/birkhoffkiki/PathBench)
- HEST: [Filiot et al.](https://www.nature.com/articles/s41592-024-02461-y)
- Patho-Bench: [Chen et al.](https://arxiv.org/abs/2601.05148)
- STAMP: [Ghaffari Laleh et al.](https://www.nature.com/articles/s41551-025-01516-3)
- THUNDER: [MICS Lab](https://github.com/MICS-Lab/thunder)
- PathoROB: [Bifold Pathomics](https://github.com/bifold-pathomics/PathoROB)
- PLISM: [Owkin](https://github.com/owkin/plism-benchmark)

## License

MIT License - see [LICENSE](LICENSE) for details.

## TODO

- [] Add scaling laws page (filtering on task / indication would be great)
- [] Used inside products ?
- [] Scrapper of literature 
- [] ChatBot
- [] Arena