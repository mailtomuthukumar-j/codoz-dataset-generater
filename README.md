# CODOZ - AI Dataset Generator

**Production-grade AI Dataset Engine for ML-ready synthetic data generation.**

```
npx codoz dataset diabetes
```

## Features

- Interactive & non-interactive modes
- Multiple formats: JSON, CSV, JSONL
- Auto domain detection
- CLI and API modes

## Quick Start

### Interactive Mode (Recommended)

```bash
npx codoz dataset
```

Flow:
```
📊 CODOZ Dataset Generator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? Dataset Topic: diabetes
? Enter dataset size: 10
? Select dataset format:
    json
  ❯ csv
    jsonl
? Confirm generation? Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Summary:
   Topic:  diabetes
   Size:   10
   Format: json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Generating dataset...

✅ Generation completed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 FILES GENERATED:

   Dataset:  codoz-dataset/dataset.json
   Metadata: codoz-dataset/metadata.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Non-Interactive Mode

```bash
npx codoz dataset diabetes --size 10 --format json
npx codoz generate loan default prediction --size 100 --format csv
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--size, -s` | Number of rows | 500 |
| `--format, -f` | Output format (json/csv/jsonl) | json |
| `--yes, -y` | Skip confirmation | false |

### API Mode

```bash
node api.js '{"topic":"diabetes","size":3,"format":"json"}'
```

## Supported Domains

| Domain | Examples |
|--------|----------|
| Medical | diabetes, heart disease |
| Financial | loan default, fraud detection |
| Education | student performance |
| Retail | customer churn |
| Environmental | air quality |
| Social | influencer metrics |

## Output

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
codoz dataset
```

## License

MIT
