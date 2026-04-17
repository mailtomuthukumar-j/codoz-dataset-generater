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

**Predefined datasets:**
| Dataset | Sources |
|---------|---------|
| heart_disease | UCI, Kaggle, HuggingFace |
| diabetes | UCI, Kaggle, HuggingFace |
| iris | UCI, HuggingFace |
| wine | UCI |
| breast_cancer | UCI, Kaggle, HuggingFace |

**Dynamic search:** Any topic works - searches HuggingFace API automatically

## Configuration

Create `.env` file in project root with all API keys:

```bash
# Kaggle (from https://www.kaggle.com/account)
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_api_key

# HuggingFace (from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=your_token

# Data.gov (from https://api.data.gov)
DATA_GOV_API_KEY=your_key
```

## Programmatic

```javascript
const { run } = require('codoz');
const result = await run('diabetes', { size: 50 });
```
