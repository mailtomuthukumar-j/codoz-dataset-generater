#!/usr/bin/env node

const prompts = require('prompts');
const { runSync } = require('./core/orchestrator');

const args = process.argv.slice(2);

function main() {
  if (args.length === 0) {
    interactiveMode();
    return;
  }

  const firstTwo = args.slice(0, 2);
  if (firstTwo[0] === 'dataset' && firstTwo[1] === 'generate') {
    directMode(args.slice(2));
    return;
  }

  console.log('Invalid command. Use: npx codoz dataset generate <topic>');
  console.log('Example: npx codoz dataset generate diabetes --size 100');
  process.exit(1);
}

function directMode(subArgs) {
  let topic = '';
  let size = 500;
  let format = 'json';

  for (let i = 0; i < subArgs.length; i++) {
    const part = subArgs[i];
    if (part === '--size' || part === '-s') {
      size = parseInt(subArgs[i + 1]) || 500;
      i++;
    } else if (part === '--format' || part === '-f') {
      const fmt = subArgs[i + 1]?.toLowerCase();
      if (['json', 'csv', 'jsonl'].includes(fmt)) format = fmt;
      i++;
    } else if (part === '--seed') {
      i++;
    } else if (!part.startsWith('-')) {
      topic = topic ? topic + ' ' + part : part;
    }
  }

  if (!topic) {
    console.log('Error: Topic is required');
    console.log('Example: npx codoz dataset generate diabetes');
    process.exit(1);
  }

  runSync(topic, { size, format });
}

async function interactiveMode() {
  const answers = await prompts([
    { type: 'text', name: 'topic', message: 'Enter dataset topic:', validate: val => val.trim().length > 0 },
    { type: 'text', name: 'size', message: 'Enter dataset size:', initial: '500' },
    { type: 'select', name: 'format', message: 'Select dataset format:', choices: [
      { title: 'json', value: 'json' },
      { title: 'csv', value: 'csv' },
      { title: 'jsonl', value: 'jsonl' }
    ], initial: 0 },
    { type: 'confirm', name: 'confirm', message: 'Confirm generation?', initial: true }
  ], { onCancel: () => { console.log('\nCancelled.'); process.exit(0); } });

  if (!answers.confirm) {
    console.log('\nCancelled.');
    return;
  }

  runSync(answers.topic, {
    size: parseInt(answers.size) || 500,
    format: answers.format
  });
}

main();
