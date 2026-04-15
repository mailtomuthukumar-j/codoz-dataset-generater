#!/usr/bin/env node

/**
 * CODOZ CLI
 * Real Data Engine - Fetches real-world datasets from multiple sources
 */

require('./utils/env');

const readline = require('readline');
const { run, getAvailableTopics, checkSources } = require('./index');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await interactiveMode();
  } else if (args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    showHelp();
  } else if (args[0] === 'topics') {
    await listTopics();
  } else if (args[0] === 'sources') {
    await checkAvailableSources();
  } else {
    const options = parseArgs(args);
    await run(options.topic, options);
  }
  
  rl.close();
}

async function interactiveMode() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           CODOZ · REAL DATA ENGINE                      ║');
  console.log('║   Fetch real datasets from Kaggle, UCI, HuggingFace     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const topic = await question('Enter dataset topic: ');
  
  if (!topic.trim()) {
    console.log('Topic is required.');
    return;
  }
  
  const sizeStr = await question('Enter dataset size (default: 100): ');
  const size = parseInt(sizeStr) || 100;
  
  const fmt = await selectFormat();
  
  const confirm = await question('\nFetch real data? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }
  
  await run(topic.trim(), { size, format: fmt });
}

async function selectFormat() {
  const formats = [
    { name: 'JSON', value: 'json', description: 'JSON array format (default)' },
    { name: 'CSV', value: 'csv', description: 'Comma-separated values' },
    { name: 'JSONL', value: 'jsonl', description: 'JSON Lines (one object per line)' },
    { name: 'TABULAR', value: 'tabular', description: 'Formatted table output' }
  ];
  
  let selectedIndex = 0;
  
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    function render() {
      rl.output.write('\x1B[2K');
      rl.output.write('\x1B[0G');
      rl.output.write('? Select dataset format:\n');
      
      formats.forEach((format, index) => {
        if (index === selectedIndex) {
          rl.output.write(`  \x1B[36m❯ ${format.name}\x1B[0m\n`);
        } else {
          rl.output.write(`    ${format.name}\n`);
        }
      });
      
      rl.output.write('\n  \x1B[90mUse ↑↓ arrows to select, Enter to confirm\x1B[0m');
      rl.output.write('\x1B[2K');
      rl.output.write('\x1B[0G');
    }
    
    render();
    
    function onKeypress(s, key) {
      if (key.name === 'up') {
        selectedIndex = (selectedIndex - 1 + formats.length) % formats.length;
        render();
      } else if (key.name === 'down') {
        selectedIndex = (selectedIndex + 1) % formats.length;
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        readline.moveCursor(process.stdout, 0, -5);
        readline.clearScreenDown(process.stdout);
        console.log(`Selected: ${formats[selectedIndex].name}`);
        rl.close();
        process.stdin.removeListener('keypress', onKeypress);
        resolve(formats[selectedIndex].value);
      }
    }
    
    process.stdin.on('keypress', onKeypress);
  });
}

async function listTopics() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              AVAILABLE DATASETS                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const topics = getAvailableTopics();
  
  topics.forEach(t => {
    console.log(`  ${t.topic.padEnd(20)} [${t.sources.join(', ')}]`);
  });
  
  console.log('\nNote: Some datasets require API credentials.');
  console.log('  - Kaggle: ~/.kaggle/kaggle.json');
  console.log('  - HuggingFace: HUGGINGFACE_API_KEY env var\n');
}

async function checkAvailableSources() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║            SOURCE AVAILABILITY                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const sources = checkSources();
  
  console.log(`  Kaggle:        ${sources.kaggle ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  UCI:           ✓ Always available`);
  console.log(`  HuggingFace:   ${sources.huggingface ? '✓ API key set' : '✗ No API key'}`);
  console.log(`  Data.gov:      ✓ Always available`);
  
  console.log('\nCONFIGURATION:');
  console.log('  Create a .env file in your project directory:');
  console.log('    HUGGINGFACE_API_KEY=your_key_here');
  console.log('  ');
  console.log('  For Kaggle, place kaggle.json in ~/.kaggle/');
  console.log('\n');
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    CODOZ HELP                           ║
╚══════════════════════════════════════════════════════════╝

USAGE:
  npx codoz <topic> [options]
  npx codoz topics
  npx codoz sources
  npx codoz help

EXAMPLES:
  npx codoz "heart disease" --size 500 --format csv
  npx codoz diabetes --size 100
  npx codoz customer churn --format jsonl

OPTIONS:
  --size <n>       Number of rows to fetch (default: 100)
  --format <fmt>  Output format: json, csv, jsonl, tabular (default: json)

COMMANDS:
  topics           List available dataset topics
  sources          Check API source availability
  help             Show this help message

DATA SOURCES:
  • Kaggle (requires ~/.kaggle/kaggle.json)
  • UCI ML Repository
  • HuggingFace Datasets (requires HUGGINGFACE_API_KEY in .env)
  • Data.gov

CONFIGURATION:
  Create a .env file with your API keys:
  - HUGGINGFACE_API_KEY=your_key

OUTPUT:
  Datasets are saved to ./codoz set/<topic>.<format>
`);
}

function parseArgs(args) {
  const options = {
    topic: '',
    size: 100,
    format: 'json'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      
      if (key === 'size') {
        options.size = parseInt(args[++i]) || 100;
      } else if (key === 'format') {
        options.format = args[++i] || 'json';
      } else if (key === 'debug') {
        options.debug = true;
      }
    } else if (!arg.startsWith('-')) {
      options.topic = arg;
    }
  }
  
  return options;
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
