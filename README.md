# CODOZ - AI Dataset Generator

**Production-grade AI Dataset Engine for ML-ready synthetic data generation.**

```
npx codoz dataset generate diabetes dataset --size 10 --format json
```

## Features

- Generate synthetic ML-ready datasets
- Multiple formats: JSON, CSV, JSONL
- Auto domain detection (medical, financial, education, retail, etc.)
- CLI and API modes

## Quick Start

### CLI Mode
```bash
npx codoz dataset generate <topic> [options]

Options:
  -s, --size <number>     Number of rows (default: 500)
  -f, --format <type>     Output format: json, csv, jsonl (default: json)
      --seed <number>     Random seed for reproducibility (default: 42)
```

### Examples

```bash
# Generate diabetes dataset (JSON)
npx codoz dataset generate diabetes dataset --size 10

# Generate loan default dataset (CSV)
npx codoz dataset generate loan default prediction --format csv --size 100

# Generate student performance dataset (JSONL)
npx codoz dataset generate student performance --format jsonl --size 50
```

### API Mode

```bash
node api.js '{"topic":"diabetes dataset","size":3,"format":"json"}'
```

Returns:
```json
{
  "success": true,
  "data": {
    "dataset_name": "diabetes_dataset",
    "format": "json",
    "records": [...],
    "row_count": 3
  },
  "meta": {
    "domain": "medical",
    "subdomain": "diabetes",
    "task_type": "classification",
    "target_column": "outcome",
    "seed": 42,
    "label_distribution": {"diabetic": 1, "healthy": 1}
  },
  "errors": null
}
```

## Supported Domains

| Domain | Examples |
|--------|----------|
| Medical | diabetes, heart disease, patient records |
| Financial | loan default, fraud detection, credit scoring |
| Education | student performance, exam scores |
| Retail | customer churn, sales data |
| Environmental | air quality, pollution metrics |
| Social | influencer metrics, engagement data |

## Output

Generates files in `codoz-dataset/`:
```
codoz-dataset/
├── dataset.json    (or .csv, .jsonl)
└── metadata.json
```

## Development

```bash
git clone https://github.com/mailtomuthukumar-j/codoz-dataset-generater.git
cd codoz-dataset-generater
npm install
npm link
codoz dataset generate test dataset
```

## License

MIT
