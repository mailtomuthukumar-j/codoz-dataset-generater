#!/usr/bin/env node

/**
 * CODOZ CLI Entry Point
 * 
 * Command-line interface for the Analysis-First Dataset Engine.
 * 
 * Usage:
 *   node cli.js "diabetes dataset" --size 100 --format json
 *   node cli.js "customer churn" --size 500 --format csv
 *   node cli.js "credit card fraud" --size 200
 */

const { Command } = require('commander');
const { run } = require('./core/orchestrator');

const program = new Command();

program
  .name('codoz')
  .description('CODOZ - Analysis-First Dataset Engine\n\nGenerate realistic ML-ready synthetic datasets from topics.')
  .version('1.0.0');

program
  .command('dataset generate')
  .description('Generate a synthetic dataset from a topic')
  .argument('<topic>', 'The topic to generate a dataset for (e.g., "diabetes dataset", "customer churn")')
  .option('-s, --size <number>', 'Number of rows to generate', '100')
  .option('-f, --format <format>', 'Output format: json, csv, or jsonl', 'json')
  .option('--seed <number>', 'Random seed for reproducibility')
  .action(async (topic, options) => {
    try {
      const result = run(topic, {
        size: parseInt(options.size) || 100,
        format: options.format || 'json',
        seed: options.seed ? parseInt(options.seed) : Date.now()
      });
      
      console.log('\nDataset generated successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\nError generating dataset:', error.message);
      process.exit(1);
    }
  });

program
  .command('topics')
  .description('List all available topics in the knowledge base')
  .action(() => {
    const { getAllTopics } = require('./core/knowledge_base');
    const topics = getAllTopics();
    
    console.log('\nAvailable Topics (' + topics.length + '):\n');
    topics.forEach(topic => {
      console.log('  ' + topic.key);
      console.log('    Name: ' + topic.name);
      console.log('    Entity: ' + topic.entity);
      console.log('    ' + topic.description.substring(0, 60) + '...');
      console.log('');
    });
  });

// Also support direct arguments without subcommand
if (process.argv.length > 2 && process.argv[2] !== 'dataset' && process.argv[2] !== 'topics') {
  const args = process.argv.slice(2);
  const options = {
    size: 100,
    format: 'json'
  };
  
  // Parse flags
  const filteredArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--size' || arg === '-s') {
      options.size = parseInt(args[++i]) || 100;
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i] || 'json';
    } else if (arg === '--seed') {
      options.seed = parseInt(args[++i]);
    } else if (arg.startsWith('--')) {
      // Skip unknown flags
    } else if (arg.startsWith('-')) {
      // Skip short flags
    } else {
      filteredArgs.push(arg);
    }
  }
  
  const topic = filteredArgs.join(' ');
  if (topic) {
    run(topic, options);
    process.exit(0);
  }
}

// Show help if no arguments
if (process.argv.length === 2) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              CODOZ · ANALYSIS-FIRST DATASET ENGINE              ║
║                                                                   ║
║   Generate realistic ML-ready synthetic datasets from topics.    ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Usage:                                                          ║
║     node cli.js "diabetes dataset" --size 100 --format json       ║
║     node cli.js "customer churn" --size 500 --format csv           ║
║     node cli.js topics                                           ║
║                                                                   ║
║   Options:                                                       ║
║     -s, --size <number>     Number of rows (default: 100)        ║
║     -f, --format <format>   Output format: json, csv, jsonl       ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Example Topics:                                                ║
║     • diabetes          • customer churn                          ║
║     • heart disease     • credit card fraud                       ║
║     • breast cancer     • loan default                            ║
║     • student performance  • employee attrition                  ║
║     • machine maintenance  • sensor monitoring                    ║
║                                                                   ║
║   Run 'node cli.js topics' to see all available topics.         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}

program.parse(process.argv);
