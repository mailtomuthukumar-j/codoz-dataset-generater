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
  
  const topic = await question(rl, '? Enter dataset topic: ');
  if (!topic.trim()) {
    console.log('? Topic is required.');
    rl.close();
    process.exit(1);
  }
  
  const sizeInput = await question(rl, '? Enter dataset size: ');
  const size = parseInt(sizeInput) || 100;
  rl.close();
  
  const format = await selectFormatMenu();
  
  const rl2 = createInterface();
  const confirm = await question(rl2, '? Confirm generation? (Y/N): ');
  rl2.close();
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    process.exit(0);
  }
  
  run(topic.trim(), { size, format }, true);
}

function selectFormatMenu() {
  const options = [
    { name: 'JSON', value: 'json' },
    { name: 'CSV', value: 'csv' },
    { name: 'JSONL', value: 'jsonl' }
  ];
  
  let selected = 0;
  
  console.log('? Select dataset format:\n');
  
  const draw = () => {
    process.stdout.write('\x1B[0G');
    for (let i = 0; i < options.length; i++) {
      readline.clearLine(process.stdout, 0);
      const prefix = i === selected ? '  \x1B[36m> ' : '    ';
      const suffix = i === selected ? '\x1B[0m' : '';
      console.log(prefix + options[i].name + suffix);
    }
    readline.moveCursor(process.stdout, 0, -options.length);
  };
  
  draw();
  
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    const onKey = (chunk) => {
      const ch = chunk;
      
      if (ch === '\x1B[A') {
        selected = (selected - 1 + options.length) % options.length;
        draw();
      } else if (ch === '\x1B[B') {
        selected = (selected + 1) % options.length;
        draw();
      } else if (ch === '\r' || ch === '\n') {
        stdin.removeListener('data', onKey);
        stdin.setRawMode(false);
        stdin.pause();
        readline.moveCursor(process.stdout, 0, options.length + 1);
        readline.clearScreenDown(process.stdout);
        resolve(options[selected].value);
      }
    };
    
    stdin.on('data', onKey);
  });
}

function showTopics() {
  console.log('');
  console.log('Available datasets:\n');
  
  const topics = [
    'heart_disease', 'diabetes', 'breast_cancer', 'customer_churn',
    'credit_card_fraud', 'loan_default', 'employee_attrition',
    'student_performance', 'iris', 'wine'
  ];
  
  topics.forEach((topic, i) => {
    console.log('  ' + (i + 1) + '. ' + topic);
  });
  
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'dataset' && args[1] === 'topics') {
    showTopics();
    process.exit(0);
  }
  
  if (args[0] === 'dataset' && args[1] === 'generator') {
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
    console.log('');
    console.log('CODOZ Dataset Generator\n');
    console.log('Usage:');
    console.log('  npx codoz dataset generator           Interactive mode');
    console.log('  npx codoz dataset generator <topic>  Direct generation');
    console.log('  npx codoz dataset topics              List datasets');
    console.log('');
    console.log('Options:');
    console.log('  --size <n>     Number of rows (default: 100)');
    console.log('  --format <fmt> Output format: json, csv, jsonl, tabular');
    console.log('');
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
