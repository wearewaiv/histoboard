# Contributing to Histoboard

Thanks for your interest in contributing to Histoboard! This project aims to make pathology foundation model benchmarks more accessible to the community.

## Ways to Contribute

### Reporting Issues

- **Incorrect data**: If you notice any incorrect benchmark results, please open an issue with a link to the source publication.
- **Missing models**: If a model is missing from a benchmark where it was evaluated, let us know.
- **Bugs**: Report any bugs or UI issues you encounter.

### Adding a New Benchmark

To add a new benchmark, you'll need to:

1. **Create benchmark metadata** in `frontend/src/data/benchmarks.json`:
   ```json
   {
     "id": "benchmark-id",
     "name": "Full Benchmark Name",
     "shortName": "Short Name",
     "category": ["pathology", "patch-level"],
     "url": "https://benchmark-paper-or-project-url",
     "organs": ["breast", "lung"],
     "taskCount": 10,
     "description": "Brief description of the benchmark."
   }
   ```

2. **Add tasks** in `frontend/src/data/tasks.json`:
   ```json
   {
     "id": "benchmark-id_task-name",
     "benchmarkId": "benchmark-id",
     "name": "Task Name",
     "organ": "breast",
     "metric": "auc",
     "category": "classification"
   }
   ```

3. **Add results** in `frontend/src/data/results.json`:
   ```json
   {
     "modelId": "existing-model-id",
     "taskId": "benchmark-id_task-name",
     "value": 0.85,
     "rank": 1,
     "source": "benchmark-id",
     "retrievedAt": "2025-01-15"
   }
   ```

4. **Create a detailed results table component** (optional but recommended) in `frontend/src/components/tables/`.

### Adding a New Model

Add model metadata to `frontend/src/data/models.json`:

```json
{
  "id": "org_model-name",
  "name": "Model Name",
  "organization": "Organization",
  "architecture": "ViT-L/16",
  "params": "307M",
  "pretrainingData": "Description of training data",
  "publicationDate": "2025-01-01",
  "license": "open-source",
  "publicationType": "peer-reviewed",
  "modelType": "vision",
  "paperUrl": "https://arxiv.org/abs/...",
  "weightsUrl": "https://huggingface.co/..."
}
```

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run the build to ensure everything works: `cd frontend && npm run build`
5. Commit your changes with a clear message
6. Push to your fork and open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/wearewaiv/histoboard.git
cd histoboard/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Sources

All benchmark data should come from official publications or repositories. When adding data, please:

- Include the source URL in the benchmark metadata
- Use the exact values reported in the original publication
- Note any transformations (e.g., if you converted accuracy to percentage)

## Code Style

- Use TypeScript for all new code
- Follow the existing code patterns in the repository
- Keep components focused and reusable
- Use Tailwind CSS for styling

## Questions?

Feel free to open an issue if you have questions or need help contributing.
