# CODOZ - Real Data Engine

Fetch real datasets from Kaggle, UCI, HuggingFace & Data.gov via CLI.

## Install

```bash
npm install
```

## Use

```bash
# Interactive mode (prompts for topic, size, format)
npx codoz

# Quick fetch
npx codoz heart_disease --size 100

# With format
npx codoz diabetes --size 50 --format csv

# List datasets
npx codoz topics

# Check sources
npx codoz sources
```

## Options

- `--size <n>` - Number of rows (default: 100)
- `--format <fmt>` - Output: json, csv, jsonl, tabular (default: json)

## Datasets

| Dataset | Sources |
|---------|---------|
| heart_disease | UCI, Kaggle |
| diabetes | UCI, Kaggle |
| iris | UCI, HuggingFace |
| wine | UCI |
| student_performance | UCI, Kaggle |
| breast_cancer | UCI, Kaggle |

## API Key (Optional)

Create `.env` file:
```
HUGGINGFACE_API_KEY=your_key_here
```

## Programmatic

```javascript
const { run } = require('codoz');
const result = await run('diabetes', { size: 50 });
```
