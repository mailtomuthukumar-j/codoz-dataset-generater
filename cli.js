#!/usr/bin/env node

/**
 * CODOZ CLI Entry Point
 * 
 * Simple, user-friendly command-line interface.
 */

const readline = require('readline');
const { run } = require('./core/orchestrator');
const { getAllTopics } = require('./core/knowledge_base');

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function interactiveMode() {
  const rl = createInterface();
  
  const topic = await question(rl, 'Enter dataset topic: ');
  if (!topic.trim()) {
    console.log('Topic is required. Exiting.');
    rl.close();
    process.exit(1);
  }
  
  const sizeInput = await question(rl, 'Enter dataset size: ');
  const size = parseInt(sizeInput) || 100;
  
  const formatInput = await question(rl, 'Select dataset format (json/csv/jsonl/tabular): ');
  const format = ['csv', 'jsonl', 'tabular'].includes(formatInput.trim().toLowerCase()) 
    ? formatInput.trim().toLowerCase() 
    : 'json';
  
  const confirm = await question(rl, 'Confirm generation? ');
  
  rl.close();
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    process.exit(0);
  }
  
  run(topic.trim(), { size, format }, true);
}

function showTopics() {
  const topics = getAllTopics();
  console.log('\nAvailable Topics (' + topics.length + '):\n');
  topics.forEach(topic => {
    console.log('  ' + topic.key);
    console.log('    ' + topic.description.substring(0, 60) + '...\n');
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'dataset' && args[1] === 'topics') {
    showTopics();
    process.exit(0);
  }
  
  if (args[0] === 'dataset' && args[1] === 'generate') {
    const topic = args.slice(2).find(a => !a.startsWith('--')) || '';
    if (!topic) {
      await interactiveMode();
      return;
    }
    
    const options = { size: 100, format: 'json' };
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--size') options.size = parseInt(args[++i]) || 100;
      if (args[i] === '--format') options.format = args[++i] || 'json';
    }
    
    run(topic, options, true);
    process.exit(0);
  }
  
  if (args.length === 0) {
    await interactiveMode();
    return;
  }
  
  if (args[0] === 'topics') {
    showTopics();
    process.exit(0);
  }
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
CODOZ - Analysis-First Dataset Engine

Usage:
  npx codoz "topic" --size 100 --format json
  npx codoz dataset generate
  npx codoz dataset topics

Options:
  --size <n>     Number of rows (default: 100)
  --format       json, csv, jsonl, or tabular (default: json)

Examples:
  npx codoz "diabetes" --size 50 --format csv
  npx codoz "customer churn" --format json
`);
    process.exit(0);
  }
  
  let topic = '';
  const options = { size: 100, format: 'json' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--') && arg.includes('=')) {
      const parts = arg.slice(2).split('=');
      if (parts[0] === 'size') options.size = parseInt(parts[1]) || 100;
      if (parts[0] === 'format') options.format = parts[1] || 'json';
      continue;
    }
    
    if (arg === '--size') options.size = parseInt(args[++i]) || 100;
    else if (arg === '--format') options.format = args[++i] || 'json';
    else if (!arg.startsWith('--')) topic += (topic ? ' ' : '') + arg;
  }
  
  if (!topic) {
    console.log('Usage: npx codoz "topic" --size 100 --format json');
    process.exit(1);
  }
  
  run(topic, options, true);
}

main();
