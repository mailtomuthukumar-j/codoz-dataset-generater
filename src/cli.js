#!/usr/bin/env node

/**
 * CODOZ CLI
 * Real Data Engine - Fetches real-world datasets from multiple sources
 */

require('./utils/env');

const readline = require('readline');
const { run, getAvailableTopics, checkSources } = require('./index');

let rl = null;

function question(query) {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return new Promise(resolve => rl.question(query, resolve));
}

function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

function printBanner() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           CODOZ · REAL DATA ENGINE                      ║');
  console.log('║   Fetch real datasets from Kaggle, UCI, HuggingFace     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  try {
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
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    closeReadline();
  }
}

async function interactiveMode() {
  printBanner();
  
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
  
  await run(topic.trim(), { size, format: fmt, silent: true });
  
  console.log('\n✓ Data fetched successfully!');
}

async function selectFormat() {
  const formats = ['JSON', 'CSV', 'JSONL', 'Tabular'];
  const values = ['json', 'csv', 'jsonl', 'tabular'];
  
  let selectedIndex = 0;
  
  return new Promise((resolve) => {
    const promptRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    function render() {
      console.log('\n? Select dataset format:');
      formats.forEach((format, index) => {
        if (index === selectedIndex) {
          console.log(`  \x1B[36m❯ ${format}\x1B[0m`);
        } else {
          console.log(`    ${format}`);
        }
      });
    }
    
    function clear() {
      readline.moveCursor(process.stdout, 0, -formats.length - 2);
      readline.clearScreenDown(process.stdout);
    }
    
    render();
    
    function onKeypress(s, key) {
      if (key.name === 'up' || key.name === 'w') {
        selectedIndex = (selectedIndex - 1 + formats.length) % formats.length;
        clear();
        render();
      } else if (key.name === 'down' || key.name === 's') {
        selectedIndex = (selectedIndex + 1) % formats.length;
        clear();
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        process.stdin.removeListener('keypress', onKeypress);
        clear();
        console.log(`Selected: ${formats[selectedIndex]}`);
        promptRl.close();
        resolve(values[selectedIndex]);
      } else if (key.name === 'escape') {
        selectedIndex = 0;
        clear();
        render();
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
  npx codoz heart_disease --size 500 --format csv
  npx codoz diabetes --size 100
  npx codoz iris --format jsonl

OPTIONS:
  --size <n>       Number of rows to fetch (default: 100)
  --format <fmt>  Output format: json, csv, jsonl, tabular

COMMANDS:
  topics           List available dataset topics
  sources          Check API source availability
  help             Show this help message

DATA SOURCES:
  • Kaggle (requires ~/.kaggle/kaggle.json)
  • UCI ML Repository
  • HuggingFace Datasets (requires HUGGINGFACE_API_KEY in .env)
  • Data.gov

OUTPUT:
  Datasets are saved to ./codoz_set/<topic>.<format>
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

process.on('exit', () => closeReadline());
process.on('SIGINT', () => {
  closeReadline();
  process.exit(0);
});

main();
