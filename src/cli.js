#!/usr/bin/env node

/**
 * CODOZ - Real Data Engine
 * Minimal CLI - Only prompts, everything else runs silently
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Set log level BEFORE requiring index (silence all modules)
const { setLevel } = require('./utils/logger');
setLevel('silent');

const { run } = require('./index');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  
  // If command line args provided, use them directly
  if (args.length > 0) {
    const options = parseArgs(args);
    if (options.topic) {
      try {
        const result = await run(options.topic, {
          size: options.size,
          format: options.format,
          silent: true
        });
        console.log(`Data saved to: ${result.output.filepath}`);
        return;
      } catch (error) {
        const errorMsg = error.message || '';
        
        if (errorMsg.includes('No data available') || errorMsg.includes('No tabular data')) {
          console.log('No data found. Try: iris, diabetes, heart_disease, stock, medical');
        } else if (errorMsg.includes('credentials') || errorMsg.includes('API key')) {
          console.log('Set HUGGINGFACE_API_KEY in .env');
        } else if (errorMsg.includes('timeout')) {
          console.log('Connection timeout. Check internet');
        } else if (errorMsg.includes('not found')) {
          console.log('Dataset not found');
        } else {
          console.log('Something went wrong');
        }
        process.exit(1);
      }
    }
  }

  try {
    const topic = await question('Enter data topic: ');
    if (!topic.trim()) {
      console.log('Operation cancelled');
      rl.close();
      return;
    }

    const sizeInput = await question('Enter data size: ');
    const size = parseInt(sizeInput) || 100;

    const format = await question('Enter data format (json/csv/jsonl): ');
    const selectedFormat = ['json', 'csv', 'jsonl'].includes(format.toLowerCase()) 
      ? format.toLowerCase() 
      : 'json';

    const confirm = await question('Process data? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled');
      rl.close();
      return;
    }

    rl.close();

    const result = await run(topic.trim(), { 
      size, 
      format: selectedFormat,
      silent: true
    });

    console.log(`Data saved to: ${result.output.filepath}`);

  } catch (error) {
    const errorMsg = error.message || '';
    
    if (errorMsg.includes('No data available') || errorMsg.includes('No tabular data')) {
      console.log('No data found for this topic. Try: iris, diabetes, heart_disease, stock, medical');
    } else if (errorMsg.includes('credentials') || errorMsg.includes('API key')) {
      console.log('API key missing. Set HUGGINGFACE_API_KEY in .env file');
    } else if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
      console.log('Connection timeout. Check your internet and try again');
    } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
      console.log('Dataset not found. Try a different topic');
    } else {
      console.log('Something went wrong. Try again');
    }
    rl.close();
    process.exit(1);
  }
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

main();
