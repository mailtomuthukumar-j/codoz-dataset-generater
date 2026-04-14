#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const CliHelper = require('../cli_helper.js');

class DatasetService {
  constructor() {
    this.helper = new CliHelper();
  }

  async generateDataset(topic, options) {
    const config = this.helper.parseArgs([
      'node',
      'service.js',
      'generate',
      topic,
      ...this.flattenOptions(options)
    ]);

    const errors = this.helper.validateOptions(config.options);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const domain = options.domain || this.helper.detectDomain(topic);
    const format = options.format || 'json';
    const size = parseInt(options.size) || 500;
    const seed = parseInt(options.seed) || 42;

    const result = {
      domain,
      subdomain: this.helper.formatSubdomain(topic),
      task_type: 'classification',
      target_column: 'outcome',
      size,
      format,
      seed,
      balanced: options.balanced || false,
      topic
    };

    return result;
  }

  flattenOptions(options) {
    const args = [];

    if (options.size) {
      args.push('--size', options.size.toString());
    }
    if (options.format) {
      args.push('--format', options.format);
    }
    if (options.seed) {
      args.push('--seed', options.seed.toString());
    }
    if (options.balanced) {
      args.push('--balanced');
    }
    if (options.domain) {
      args.push('--domain', options.domain);
    }
    if (options.output) {
      args.push('--output', options.output);
    }
    if (options.verbose) {
      args.push('--verbose');
    }

    return args;
  }

  getDatasetMetadata(topic, options) {
    const config = this.helper.parseArgs([
      'node',
      'service.js',
      'generate',
      topic,
      ...this.flattenOptions(options)
    ]);

    return {
      dataset_name: `${this.helper.formatSubdomain(topic)}_dataset`,
      generated_by: 'CODOZ',
      version: '1.0.0',
      seed: parseInt(config.options.seed) || 42,
      domain: options.domain || this.helper.detectDomain(topic),
      subdomain: this.helper.formatSubdomain(topic),
      task_type: 'classification',
      target_column: 'outcome',
      total_rows: parseInt(config.options.size) || 500,
      format: config.options.format || 'json',
      generated_at: new Date().toISOString()
    };
  }

  listSupportedDomains() {
    return [
      { id: 'medical', name: 'Medical', description: 'Diabetes, heart disease, clinical diagnostics' },
      { id: 'financial', name: 'Financial', description: 'Loan default, fraud detection, credit scoring' },
      { id: 'education', name: 'Education', description: 'Student performance, exam scores, GPA' },
      { id: 'retail', name: 'Retail', description: 'Customer behavior, churn prediction, sales' },
      { id: 'environmental', name: 'Environmental', description: 'Air quality, pollution, climate data' },
      { id: 'social', name: 'Social', description: 'Social media metrics, influencer analysis' },
      { id: 'other', name: 'Other', description: 'Custom domains with auto-detection' }
    ];
  }

  getSupportedFormats() {
    return ['json', 'csv', 'jsonl'];
  }

  validateFormat(format) {
    return this.getSupportedFormats().includes(format);
  }

  getOutputStrategy(totalRows) {
    if (totalRows <= 500) {
      return {
        strategy: 'single',
        chunks: 1,
        chunkSize: totalRows,
        indexNeeded: false
      };
    } else if (totalRows <= 5000) {
      return {
        strategy: 'chunked',
        chunks: Math.ceil(totalRows / 500),
        chunkSize: 500,
        indexNeeded: false
      };
    } else {
      return {
        strategy: 'chunked_indexed',
        chunks: Math.ceil(totalRows / 500),
        chunkSize: 500,
        indexNeeded: true
      };
    }
  }
}

module.exports = DatasetService;
