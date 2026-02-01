# Histoboard

A centralized dashboard aggregating benchmark results to compare pathology foundation models.

**Live Demo:** [https://afiliot.github.io/histoboard](https://afiliot.github.io/histoboard)

## Overview

Histoboard provides a unified view of pathology foundation model performance across **10 benchmarks**, **69 models**, and **400+ evaluation tasks**. It enables researchers and practitioners to make informed decisions when selecting models for computational pathology applications.

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
- Suggest new models to integrate via Issues
- Suggest new benchmarks to integrate via Issues

## Citation

If you use Histoboard in your research, please cite:

```bibtex
@misc{histoboard2025,
  title={Histoboard: A Unified Dashboard for Pathology Foundation Model Benchmarks},
  author={Alexandre Filiot},
  year={2025},
  url={https://afiliot.github.io/histoboard}
}
```

## Acknowledgments

This project aggregates data from multiple benchmark sources. Please cite the original benchmark papers when using their data.

## License

MIT License - see [LICENSE](LICENSE) for details.

## TODO


- [] Used inside products ?
- [] Scrapper of literature 
- [] ChatBot
- [] Arena
- [] Harmonize tasks