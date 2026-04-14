#!/usr/bin/env node

const prompts = require('prompts');
const fs = require('fs');
const path = require('path');

const ANALYZER = require('./lib/analyzer');
const SCHEMA_BUILDER = require('./lib/schema_builder');
const GENERATOR = require('./lib/generator');
const CLEANER = require('./lib/cleaner');
const VALIDATOR = require('./lib/validator');
const COMPARATOR = require('./lib/comparator');
const METADATA = require('./lib/metadata');
const OUTPUT = require('./lib/output');

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

  console.log('Invalid command. Use: npx codoz dataset generate');
  process.exit(1);
}

function directMode(subArgs) {
  let topic = '';
  let size = null;
  let format = null;

  for (let i = 0; i < subArgs.length; i++) {
    const part = subArgs[i];
    if (part === '--size' || part === '-s') {
      size = parseInt(subArgs[i + 1]) || 500;
      i++;
    } else if (part === '--format' || part === '-f') {
      const fmt = subArgs[i + 1]?.toLowerCase();
      if (['json', 'csv', 'jsonl'].includes(fmt)) format = fmt;
      i++;
    } else if (!part.startsWith('-')) {
      topic = topic ? topic + ' ' + part : part;
    }
  }

  if (!topic) {
    interactiveMode();
    return;
  }

  runGenerator(topic, size, format);
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

  runGenerator(answers.topic, parseInt(answers.size) || 500, answers.format);
}

async function runGenerator(topic, size, format) {
  const finalSize = size || 500;
  const finalFormat = format || 'json';

  const topicAnalysis = ANALYZER.analyze(topic);
  const schema = SCHEMA_BUILDER.build(topicAnalysis);

  let dataset = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const rawData = GENERATOR.create(schema, finalSize);

    const cleanedData = CLEANER.process(rawData, schema);

    if (VALIDATOR.validate(cleanedData, schema) &&
        COMPARATOR.isRealistic(cleanedData, schema)) {
      dataset = cleanedData;
      break;
    }
  }

  if (!dataset) {
    console.error('Failed to generate valid dataset.');
    process.exit(1);
  }

  const metadata = METADATA.create(topic, dataset, schema, finalSize, finalFormat);
  OUTPUT.save(dataset, metadata, finalFormat);

  console.log('\nDataset generated successfully.');
}

main();
