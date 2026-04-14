#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CliHelper {
  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.outputDir = path.join(this.projectRoot, 'dataset');
    this.ensureDirectories();
  }

  findProjectRoot() {
    let currentDir = __dirname;
    while (currentDir !== path.parse(currentDir).root) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return __dirname;
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'raw'),
      path.join(this.outputDir, 'processed'),
      path.join(this.outputDir, 'metadata')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  parseArgs(argv) {
    const args = {
      command: null,
      topic: null,
      options: {}
    };

    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i];

      if (['generate', 'test', 'list-domains'].includes(arg)) {
        args.command = arg;
      } else if (arg.startsWith('--')) {
        const key = arg.replace('--', '');
        const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
        args.options[key] = value;
      } else if (arg.startsWith('-') && arg.length === 2) {
        const short = arg.replace('-', '');
        const key = this.shortToLong(short);
        const value = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true;
        args.options[key] = value;
      } else if (!args.command) {
        args.topic = arg;
      } else if (!args.topic && args.command === 'generate') {
        args.topic = arg;
      }
    }

    return args;
  }

  shortToLong(short) {
    const map = {
      's': 'size',
      'f': 'format',
      'd': 'domain',
      'o': 'output',
      'v': 'verbose'
    };
    return map[short] || short;
  }

  validateOptions(options) {
    const errors = [];

    if (options.size) {
      const size = parseInt(options.size);
      if (isNaN(size) || size < 1 || size > 100000) {
        errors.push('Size must be between 1 and 100000');
      }
    }

    if (options.format) {
      const validFormats = ['json', 'csv', 'jsonl'];
      if (!validFormats.includes(options.format)) {
        errors.push(`Format must be one of: ${validFormats.join(', ')}`);
      }
    }

    if (options.seed) {
      const seed = parseInt(options.seed);
      if (isNaN(seed) || seed < 0) {
        errors.push('Seed must be a non-negative integer');
      }
    }

    return errors;
  }

  detectDomain(topic) {
    const topicLower = topic.toLowerCase();

    const domainKeywords = {
      medical: ['diabetes', 'health', 'medical', 'patient', 'disease', 'heart', 'blood'],
      financial: ['loan', 'credit', 'fraud', 'financial', 'bank', 'payment'],
      education: ['student', 'education', 'school', 'grade', 'gpa', 'exam'],
      retail: ['retail', 'customer', 'shopping', 'sales', 'purchase'],
      environmental: ['pollution', 'climate', 'environmental', 'air', 'weather'],
      social: ['social', 'twitter', 'instagram', 'influencer', 'engagement']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => topicLower.includes(kw))) {
        return domain;
      }
    }

    return 'other';
  }

  getOutputPath(options) {
    const format = options.format || 'json';
    const subdomain = this.formatSubdomain(options.topic || 'dataset');

    if (options.output) {
      return path.resolve(options.output);
    }

    return path.join(this.outputDir, 'processed', `${subdomain}_dataset.${format}`);
  }

  formatSubdomain(topic) {
    const words = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const filtered = words.filter(w =>
      !['dataset', 'data', 'generate', 'prediction', 'detection', 'analysis'].includes(w)
    );
    return filtered.slice(0, 2).join('_') || 'dataset';
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  checkDependencies() {
    try {
      require.resolve('chalk');
      require.resolve('commander');
      require.resolve('cli-table3');
      require.resolve('ora');
      return true;
    } catch (e) {
      return false;
    }
  }

  installDependencies() {
    console.log('Installing dependencies...');
    try {
      execSync('npm install', { cwd: this.projectRoot, stdio: 'inherit' });
      return true;
    } catch (e) {
      console.error('Failed to install dependencies');
      return false;
    }
  }
}

module.exports = CliHelper;
