/**
 * CODOZ Packager Agent
 * 
 * Delivers the final dataset to the user:
 * 1. Format output (JSON/CSV/JSONL)
 * 2. Generate metadata
 * 3. Create README
 * 4. Save files
 */

const fs = require('fs');
const path = require('path');

function process(context) {
  const { dataset, schema, topicAnalysis, validationResult, qualityScore, format, size } = context;
  
  console.log('━'.repeat(60));
  console.log('PHASE 5: DELIVERY');
  console.log('━'.repeat(60));
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'dataset');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate filename
  const safeName = generateSafeFilename(topicAnalysis?.topic || 'dataset');
  const timestamp = Date.now();
  const prefix = `${safeName}_${timestamp}`;
  
  console.log(`\nPackaging dataset...`);
  console.log(`  - Format: ${format || 'json'}`);
  console.log(`  - Rows: ${dataset.length}`);
  console.log(`  - Columns: ${schema.columns.length}`);
  
  // Generate metadata
  const metadata = generateMetadata(context, prefix);
  
  // Write data file
  const dataFilename = writeDataFile(dataset, format, outputDir, prefix);
  
  // Write metadata file
  const metadataFilename = writeMetadataFile(metadata, outputDir, prefix);
  
  // Write README
  const readmeFilename = writeReadme(metadata, outputDir, prefix);
  
  console.log(`\nDataset delivered successfully!`);
  console.log(`  - Data file: ${dataFilename}`);
  console.log(`  - Metadata: ${metadataFilename}`);
  console.log(`  - README: ${readmeFilename}`);
  console.log(`\n  Output directory: ${outputDir}`);
  
  return {
    ...context,
    outputFiles: {
      data: dataFilename,
      metadata: metadataFilename,
      readme: readmeFilename
    },
    metadata,
    logs: [...context.logs, createLog('delivery_complete', {
      format: format || 'json',
      rows: dataset.length,
      columns: schema.columns.length,
      qualityScore,
      outputDir
    })]
  };
}

function generateSafeFilename(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

function generateMetadata(context, prefix) {
  const { dataset, schema, topicAnalysis, validationResult, qualityScore, format } = context;
  
  const targetCol = schema.columns.find(c => c.isTarget);
  const idCol = schema.columns.find(c => c.isId);
  
  // Calculate target distribution
  let targetDistribution = {};
  if (targetCol && targetCol.dataType === 'categorical') {
    dataset.forEach(row => {
      const val = String(row[targetCol.name]);
      targetDistribution[val] = (targetDistribution[val] || 0) + 1;
    });
  }
  
  // Build schema definition
  const schemaDefinition = schema.columns.map(col => ({
    name: col.name,
    type: col.dataType,
    description: col.description,
    isTarget: col.isTarget,
    isId: col.isId,
    range: col.range,
    categories: col.categories,
    unit: col.unit
  }));
  
  return {
    datasetName: topicAnalysis?.topic || 'Unknown Dataset',
    generatedBy: 'CODOZ - Analysis-First Dataset Engine',
    generationTimestamp: new Date().toISOString(),
    version: '1.0.0',
    
    topic: topicAnalysis?.topic,
    description: topicAnalysis?.description,
    entity: topicAnalysis?.entity,
    context: topicAnalysis?.context,
    
    target: {
      name: targetCol?.name,
      type: targetCol?.dataType,
      values: targetCol?.categories || targetCol?.range
    },
    
    statistics: {
      totalRows: dataset.length,
      totalColumns: schema.columns.length,
      targetDistribution,
      qualityScore: qualityScore || validationResult?.score || 0
    },
    
    validation: validationResult ? {
      status: validationResult.status,
      score: validationResult.score,
      testsPassed: validationResult.tests?.filter(t => t.passed).length || 0,
      totalTests: validationResult.tests?.length || 0
    } : null,
    
    schema: schemaDefinition,
    
    columns: schema.columns.map(c => ({
      name: c.name,
      dataType: c.dataType,
      description: c.description,
      range: c.range,
      categories: c.categories,
      unit: c.unit,
      isTarget: c.isTarget,
      isId: c.isId
    })),
    
    generationInfo: {
      source: 'codoz_knowledge_base',
      matchConfidence: topicAnalysis?.matchConfidence || 0.5,
      causalRulesApplied: schema.constraints?.correlationRules?.length || 0
    }
  };
}

function writeDataFile(dataset, format, outputDir, prefix) {
  let filename;
  let content;
  
  switch (format) {
    case 'csv':
      filename = `${prefix}.csv`;
      content = generateCSV(dataset);
      break;
    
    case 'jsonl':
      filename = `${prefix}.jsonl`;
      content = dataset.map(row => JSON.stringify(row)).join('\n');
      break;
    
    case 'json':
    default:
      filename = `${prefix}.json`;
      content = JSON.stringify(dataset, null, 2);
      break;
  }
  
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  
  return filepath;
}

function generateCSV(dataset) {
  if (dataset.length === 0) return '';
  
  const headers = Object.keys(dataset[0]);
  const rows = dataset.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val);
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

function writeMetadataFile(metadata, outputDir, prefix) {
  const filename = `${prefix}_metadata.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf8');
  
  return filepath;
}

function writeReadme(metadata, outputDir, prefix) {
  const filename = `${prefix}_README.md`;
  const filepath = path.join(outputDir, filename);
  
  const readme = generateReadme(metadata);
  fs.writeFileSync(filepath, readme, 'utf8');
  
  return filepath;
}

function generateReadme(metadata) {
  return `# ${metadata.datasetName}

## Overview

This dataset was generated by **CODOZ** - an Analysis-First Dataset Engine.

- **Generated**: ${new Date(metadata.generationTimestamp).toLocaleString()}
- **Entity**: ${metadata.entity || 'Unknown'}
- **Context**: ${metadata.context || 'General'}
- **Quality Score**: ${(metadata.statistics.qualityScore || 0).toFixed(1)}%

## Description

${metadata.description || 'No description available.'}

## Dataset Statistics

- **Total Rows**: ${metadata.statistics.totalRows}
- **Total Columns**: ${metadata.statistics.totalColumns}
- **Target Distribution**:
${formatTargetDistribution(metadata.statistics.targetDistribution)}

## Schema

| Column | Type | Description |
|--------|------|-------------|
${metadata.columns.map(col => {
  const type = col.dataType + (col.range ? ` [${col.range[0]}-${col.range[1]}]` : col.categories ? ` (${col.categories.length} categories)` : '');
  const target = col.isTarget ? ' [TARGET]' : '';
  const id = col.isId ? ' [ID]' : '';
  return `| ${col.name}${target}${id} | ${type} | ${col.description || '-'} |`;
}).join('\n')}

## Target Variable

- **Name**: ${metadata.target.name}
- **Type**: ${metadata.target.type}
- **Values**: ${Array.isArray(metadata.target.values) ? metadata.target.values.join(', ') : metadata.target.values}

## Validation Results

${metadata.validation ? `
- **Status**: ${metadata.validation.status}
- **Score**: ${metadata.validation.score.toFixed(1)}%
- **Tests Passed**: ${metadata.validation.testsPassed}/${metadata.validation.totalTests}
` : 'No validation data available.'}

## Generation Info

- **Source**: ${metadata.generationInfo.source}
- **Match Confidence**: ${(metadata.generationInfo.matchConfidence * 100).toFixed(0)}%
- **Causal Rules Applied**: ${metadata.generationInfo.causalRulesApplied}

---
*Generated by CODOZ - Analysis-First Dataset Engine*
`;
}

function formatTargetDistribution(dist) {
  if (!dist || Object.keys(dist).length === 0) return '  - No distribution data';
  
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  
  return Object.entries(dist)
    .map(([val, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `  - ${val}: ${count} (${pct}%)`;
    })
    .join('\n');
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
