# CODOZ - Real Data Engine

Fetch real-world datasets from Kaggle, UCI ML Repository, HuggingFace, and Data.gov via CLI.

## Quick Start

```bash
# Install dependencies
npm install

# Fetch a dataset
npx codoz heart_disease --size 100

# Or use it as a module
const { run } = require('codoz');
const result = await run('diabetes', { size: 50, format: 'csv' });
```

## Installation

```bash
npm install -g codoz
```

Or run directly with `npx`:

```bash
npx codoz <topic> [options]
```

## Usage

### CLI Commands

```bash
# Fetch a dataset
npx codoz heart_disease --size 100
npx codoz diabetes --size 500 --format csv
npx codoz iris --size 10

# List available datasets
npx codoz topics

# Check source availability
npx codoz sources

# Help
npx codoz --help
```

### Available Datasets

| Dataset | Sources | Description |
|---------|---------|-------------|
| heart_disease | UCI, Kaggle | Heart failure clinical data |
| diabetes | UCI, Kaggle | Pima Indians diabetes dataset |
| breast_cancer | UCI, Kaggle | Wisconsin breast cancer data |
| customer_churn | Kaggle | Telco customer churn data |
| student_performance | UCI, Kaggle | Student grades data |
| iris | UCI, HuggingFace | Iris flower classification |
| wine | UCI | Wine classification dataset |

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--size <n>` | Number of rows to fetch | 100 |
| `--format <fmt>` | Output format: json, csv, jsonl, tabular | json |
| `--debug` | Enable debug logging | false |

## Configuration

### HuggingFace API Key (Optional)

Create a `.env` file in your project directory:

```
HUGGINGFACE_API_KEY=your_key_here
```

Get your API key at: https://huggingface.co/settings/api

### Kaggle Credentials (Optional)

Place `kaggle.json` in `~/.kaggle/`:

```json
{
  "username": "your_username",
  "key": "your_api_key"
}
```

Get your credentials at: https://www.kaggle.com/account

### Data Sources

| Source | Availability | Auth Required |
|--------|--------------|---------------|
| UCI ML Repository | Always | No |
| Kaggle | With credentials | Yes |
| HuggingFace | With API key | Yes |
| Data.gov | Always | No |

## Programmatic Usage

```javascript
const { run, getAvailableTopics, checkSources } = require('codoz');

// Fetch a dataset
const result = await run('heart_disease', {
  size: 100,
  format: 'json',
  silent: false,
  debug: false
});

console.log(result.success);
console.log(result.rowCount);
console.log(result.output.filepath);
console.log(result.qualityScore);

// List available topics
const topics = getAvailableTopics();

// Check source availability
const sources = checkSources();
```

## Output

Datasets are saved to `codoz set/` directory with the following formats:

- **JSON** - Full dataset as JSON array
- **CSV** - Comma-separated values
- **JSONL** - One JSON object per line
- **Tabular** - Formatted table output

## API

### run(topic, options)

Fetch a dataset for the given topic.

**Parameters:**
- `topic` (string): Dataset topic (e.g., 'heart_disease', 'diabetes')
- `options` (object):
  - `size` (number): Number of rows (default: 100)
  - `format` (string): Output format (default: 'json')
  - `silent` (boolean): Suppress console output (default: false)
  - `debug` (boolean): Enable debug logging (default: false)

**Returns:**
```javascript
{
  success: true,
  output: { filepath, filename, size, format },
  rowCount: 100,
  format: 'json',
  method: 'primary',
  qualityScore: 100.0,
  metadata: { ... },
  pipelineReport: { ... },
  qualityReport: { ... }
}
```

## License

MIT
