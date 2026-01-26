# Histoboard

A centralized dashboard for pathology foundation model benchmark results, aggregating data from 8+ sources with rank-based comparisons.

## Features

- **Unified Leaderboard**: Compare pathology foundation models across multiple benchmarks
- **Rank-Based Comparison**: Fair comparison using mean rank aggregation
- **Advanced Filtering**: Filter by task category, organ, and benchmark source
- **Model Details**: Detailed breakdown of each model's performance
- **Data Attribution**: Clear links to original benchmark sources

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Charts | Recharts |
| Scraping | Python, httpx, BeautifulSoup |
| Hosting | GitHub Pages (static) |

## Project Structure

```
histoboard/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Pages (home, leaderboard, models, benchmarks)
│   │   ├── components/    # React components
│   │   ├── data/          # Static JSON data
│   │   ├── types/         # TypeScript definitions
│   │   ├── lib/           # Utilities and ranking algorithm
│   │   └── hooks/         # React hooks
│   └── package.json
│
├── scraper/               # Python data collection
│   ├── src/
│   │   ├── scrapers/      # Source-specific scrapers
│   │   ├── normalizers/   # Model name mapping
│   │   └── exporters/     # JSON export
│   └── pyproject.toml
│
└── .github/workflows/     # CI/CD
    ├── deploy.yml         # GitHub Pages deployment
    └── scrape.yml         # Scheduled data scraping
```

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

### Building for Production

```bash
cd frontend
npm run build
```

Static files will be generated in `frontend/out/`.

### Running the Scraper

```bash
cd scraper
pip install -e .
python -m src.main
```

## Ranking Methodology

Models are ranked using mean rank aggregation:

1. For each task, models are ranked by performance (1 = best)
2. Ties are handled using average rank assignment
3. The mean rank across all tasks determines overall ranking
4. Filter support for task category, organ, and benchmark source

## Data Sources

- [EVA Benchmark](https://kaiko.ai/benchmarks/eva) - Patch-level classification
- [HEST Benchmark](https://github.com/mahmoodlab/HEST) - Slide-level analysis
- [PLISM Benchmark](https://github.com/mahdihosseini/PLISM) - Linear probing tasks
- [PathBench](https://pathbench.ai) - Slide classification and survival
- [Stanford TissueNet](https://tissuenet.research.stanford.edu) - Segmentation

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

MIT License
