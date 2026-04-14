# CODOZ - AI Dataset Engine

Production-grade synthetic dataset generator for machine learning applications.

## Features

- **Domain-Aware Generation**: Automatically detects domain (medical, financial, education, etc.)
- **Realistic Correlations**: Enforces real-world feature relationships
- **Class Balance Control**: Supports custom label distributions
- **Multiple Output Formats**: JSON, CSV, JSONL (parquet not supported)
- **Metadata Output**: Every dataset includes schema.json
- **Chunked Output**: Large datasets automatically split into manageable chunks

## Installation

```bash
npm install
```

## Usage

```bash
# Generate a diabetes dataset (500 rows, JSON format)
npx codoz generate diabetes dataset

# Custom size and format
npx codoz generate loan default prediction --size 1000 --format csv

# With seed for reproducibility
npx codoz generate student performance --size 100 --seed 12345

# Balanced classes
npx codoz generate fraud detection --balanced
```

## Command Options

| Flag | Description | Default |
|------|-------------|---------|
| `--size <n>` | Number of rows | 500 |
| `--format <type>` | Output format (json/csv/jsonl) | json |
| `--seed <n>` | Random seed for reproducibility | 42 |
| `--balanced` | Equal class distribution | false |

## Supported Domains

- **Medical**: Diabetes, heart disease, general diagnostics
- **Financial**: Loan default, fraud detection, credit scoring
- **Education**: Student performance, exam scores
- **Environmental**: Pollution, climate data
- **Retail**: Customer behavior, sales data
- **Other**: Custom domains with auto-detection

## Output Structure

```
dataset/
├── raw/                    # Chunked pre-validation output
├── processed/              # Cleaned, validated output
└── metadata/               # schema.json, README per dataset
```

## Dataset Metadata

Every generated dataset includes:
- Dataset name and generation timestamp
- Domain and subdomain
- Task type and target column
- Total rows and chunks
- Label distribution
- Full schema definition

## System Requirements

- Node.js >= 16.0.0
- Python 3.8+ (for backend processing)
- OpenAI API key (in .env file)

## License

MIT
