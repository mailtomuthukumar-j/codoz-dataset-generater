#!/usr/bin/env node

/**
 * CODOZ - Real Data Engine
 * Minimal CLI - Only prompts, everything else runs silently
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const { setLevel } = require('./utils/logger');
setLevel('silent');

const { checkApiKeys } = require('./utils/env');
const { run } = require('./index');

function checkKeys() {
  const { status, missing, allPresent } = checkApiKeys();
  if (!allPresent) {
    console.log('API Keys Required:');
    console.log('  - HuggingFace: Set HUGGINGFACE_API_KEY in .env');
    console.log('  - Kaggle: Set KAGGLE_USERNAME and KAGGLE_KEY in .env');
    console.log('');
  }
  return allPresent;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function selectFormat() {
  const formats = ['json', 'csv', 'jsonl'];
  let selected = 0;
  
  console.log('Enter data format:');
  for (let i = 0; i < formats.length; i++) {
    const marker = i === selected ? '>' : ' ';
    console.log(`${marker} ${formats[i]}`);
  }
  
  return new Promise(resolve => {
    const onKey = (chunk) => {
      const ch = chunk;
      if (ch === '\u001B[B') { // down
        selected = (selected + 1) % formats.length;
        draw();
      } else if (ch === '\u001B[A') { // up  
        selected = (selected - 1 + formats.length) % formats.length;
        draw();
      } else if (ch === '\r' || ch === '\n') {
        process.stdin.removeListener('data', onKey);
        resolve(formats[selected]);
      }
    };
    const draw = () => {
      for (let i = 0; i < formats.length; i++) {
        process.stdout.moveCursor(0, -1);
        readline.clearLine(process.stdout, 0);
        const marker = i === selected ? '>' : ' ';
        console.log(`${marker} ${formats[i]}`);
      }
      process.stdout.moveCursor(0, -(formats.length - 1));
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onKey);
  });
}

function parseArgs(args) {
  const options = { topic: '', size: 100, format: 'json' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'size') options.size = parseInt(args[++i]) || 100;
      else if (key === 'format') options.format = args[++i] || 'json';
    } else if (!arg.startsWith('-')) {
      options.topic = arg;
    }
  }
  return options;
}

async function main() {
  checkKeys();
  
  const args = process.argv.slice(2);
  
  // Direct command mode
  if (args.length > 0) {
    const opts = parseArgs(args);
    if (opts.topic) {
      try {
        const result = await run(opts.topic, {
          size: opts.size,
          format: opts.format,
          silent: true
        });
        console.log(`Data saved to: ${result.output.filepath}`);
        console.log(`Data source: ${result.dataSource}`);
        return;
      } catch (error) {
        const err = error.message || '';
        if (err.includes('No data')) {
          console.log('Error: No data found');
          console.log('Tip: Try: heart_disease, diabetes, stock_market');
        } else if (err.includes('credentials')) {
          console.log('Error: API key missing');
        } else {
          console.log('Error:', err.substring(0, 60));
        }
        process.exit(1);
      }
    }
  }
  
  // Interactive mode
  try {
    const topic = await question('Enter data topic: ');
    if (!topic.trim()) {
      console.log('Operation cancelled');
      rl.close();
      return;
    }

    const sizeInput = await question('Enter data size: ');
    const size = parseInt(sizeInput) || 100;

    const format = await selectFormat();

    const confirm = await question('Now proceed: (Y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled');
      rl.close();
      return;
    }

    rl.close();

    const result = await run(topic.trim(), { 
      size, 
      format,
      silent: true
    });

    console.log(`Data saved to: ${result.output.filepath}`);
    console.log(`Data source: ${result.dataSource}`);

  } catch (error) {
    const err = error.message || '';
    if (err.includes('No data')) {
      console.log('Error: No data found');
    } else if (err.includes('credentials')) {
      console.log('Error: API key missing');
    } else {
      console.log('Error:', err.substring(0, 60));
    }
    rl.close();
    process.exit(1);
  }
}

main();