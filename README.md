# CODOZ - Real Data Engine

Fetch real-world datasets from Kaggle, UCI, HuggingFace via CLI.

## Install

```bash
npm install
```

## Quick Start

```bash
# Generate data for a topic
node src/cli.js heart_disease_prediction --size 100

# Interactive mode
npm start

# Quick fetch
node src/cli.js diabetes_prediction --size 50 --format json
```

## Supported Topics

### Medical
- heart_disease_prediction
- diabetes_prediction  
- breast_cancer_detection
- lung_cancer_prediction
- kidney_disease_classification
- liver_disease_prediction
- stroke_risk_prediction
- covid19_risk_analysis
- xray_pneumonia_detection
- medical_diagnosis_system

### Financial
- stock_market_prediction
- crypto_price_prediction
- bank_loan_approval
- credit_card_fraud_detection
- credit_score_prediction
- house_price_prediction
- financial_risk_assessment
- forex_rate_forecasting

### Ecommerce
- customer_churn_prediction
- customer_lifetime_value
- sales_forecasting

### NLP
- sentiment_analysis_dataset
- spam_email_detection
- hate_speech_detection
- fake_news_detection

### Other
- weather_forecasting_dataset
- traffic_congestion_prediction

## Data Source Priority

The system follows this priority:

1. **REAL** - From configured sources (Kaggle, UCI, HuggingFace)
2. **SEARCH** - Dynamic search on HuggingFace
3. **SYNTHETIC** - Generated using domain blueprints

The returned object includes `dataSource` field indicating which path was used.

## API Keys

Set in `.env` file:

```
HUGGINGFACE_API_KEY=your_key_here
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_key
```

## Output

Data is saved to `codoz_set/` folder in JSON format by default.

## CLI Options

```bash
node src/cli.js <topic> --size 100 --format json
```

- `--size`: Number of rows (default: 100)
- `--format`: json, csv, or jsonl (default: json)
- `--no-cache`: Skip cached data, force fresh fetch

## Programmatic Use

```javascript
const { run } = require('./src/index');

const result = await run('heart_disease_prediction', { size: 50 });
console.log(result.dataSource); // 'real', 'search', or 'synthetic'
console.log(result.data);    // array of data rows
console.log(result.rowCount);
```

## Tests

```bash
npm test
```

## Cache

Cache is stored in `.codoz_cache/` and expires after 30 minutes. Use `--no-cache` to skip.