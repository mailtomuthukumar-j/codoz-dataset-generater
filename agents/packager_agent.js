const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

function package(context) {
  const dataset = context.dataset;
  const schema = context.schema;
  const format = context.format || 'json';
  const metadata = context.validation_report || {};
  const label_distribution = context.label_distribution || {};
  
  if (!dataset || dataset.length === 0) {
    return {
      ...context,
      output_files: [],
      logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'packager_error', data: { error: 'No dataset to save' } }]
    };
  }
  
  const outputDir = path.join(cwd, 'dataset');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const baseName = context.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const chunkSize = 500;
  const outputFiles = [];
  
  if (dataset.length <= chunkSize) {
    const filePath = saveDataset(dataset, format, outputDir, baseName);
    outputFiles.push({ path: filePath, rows: dataset.length });
  } else {
    const chunks = Math.ceil(dataset.length / chunkSize);
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, dataset.length);
      const chunk = dataset.slice(start, end);
      const chunkName = `${baseName}_${String(i + 1).padStart(3, '0')}`;
      const filePath = saveDataset(chunk, format, outputDir, chunkName);
      outputFiles.push({ path: filePath, rows: chunk.length });
    }
  }
  
  const metaData = generateMetadata(context, outputFiles, label_distribution);
  const metaPath = path.join(outputDir, `${baseName}_metadata.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
  outputFiles.push({ path: metaPath, type: 'metadata' });
  
  const readme = generateReadme(context, metaData);
  const readmePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(readmePath, readme);
  outputFiles.push({ path: readmePath, type: 'readme' });
  
  console.log('\nDataset generated successfully!');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Total rows: ${dataset.length}`);
  console.log(`Columns: ${schema?.columns?.length || 0}`);
  console.log(`Quality score: ${(context.final_quality_score || 0).toFixed(1)}/100`);
  console.log(`Refinement cycles: ${context.refinement_cycle || 0}`);
  console.log(`Schema source: ${schema?.schema_source || 'unknown'}`);
  console.log('\nFiles created:');
  for (const file of outputFiles) {
    console.log(`  - ${path.basename(file.path)}`);
  }
  
  return {
    ...context,
    output_files: outputFiles,
    metadata: metaData,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'packaging_complete',
      data: { files: outputFiles.length, rows: dataset.length }
    }]
  };
}

function saveDataset(dataset, format, outputDir, baseName) {
  switch (format) {
    case 'csv':
      return saveCSV(dataset, outputDir, baseName);
    case 'jsonl':
      return saveJSONL(dataset, outputDir, baseName);
    default:
      return saveJSON(dataset, outputDir, baseName);
  }
}

function saveJSON(dataset, outputDir, baseName) {
  const filePath = path.join(outputDir, `${baseName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
  return filePath;
}

function saveCSV(dataset, outputDir, baseName) {
  if (dataset.length === 0) return null;
  
  const filePath = path.join(outputDir, `${baseName}.csv`);
  const headers = Object.keys(dataset[0]);
  const lines = [headers.join(',')];
  
  for (const row of dataset) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      return val;
    });
    lines.push(values.join(','));
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  return filePath;
}

function saveJSONL(dataset, outputDir, baseName) {
  const filePath = path.join(outputDir, `${baseName}.jsonl`);
  const lines = dataset.map(row => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, lines);
  return filePath;
}

function generateMetadata(context, outputFiles, labelDistribution) {
  const schema = context.schema || {};
  const targetColumn = schema.columns?.find(c => c.is_target);
  
  const datasetLabelDistribution = {};
  if (context.dataset && targetColumn) {
    const counts = {};
    for (const row of context.dataset) {
      const label = String(row[targetColumn.name]);
      counts[label] = (counts[label] || 0) + 1;
    }
    for (const [label, count] of Object.entries(counts)) {
      datasetLabelDistribution[label] = count;
    }
  }
  
  return {
    dataset_name: `${context.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dataset`,
    generated_by: 'CODOZ',
    generation_timestamp: new Date().toISOString(),
    topic: context.topic,
    domain: context.domain,
    subdomain: context.subdomain,
    task_type: context.task_type,
    target_column: targetColumn?.name || 'target',
    total_rows: context.dataset?.length || 0,
    total_columns: schema.columns?.length || 0,
    chunk_count: outputFiles.filter(f => f.type !== 'metadata' && f.type !== 'readme').length,
    format: context.format || 'json',
    final_quality_score: context.final_quality_score || 0,
    refinement_cycles_used: context.refinement_cycle || 0,
    schema_source: schema.schema_source || 'unknown',
    label_distribution: datasetLabelDistribution,
    schema: schema.columns?.map(col => ({
      name: col.name,
      dtype: col.dtype,
      range: col.range || null,
      categories: col.categories || null,
      is_target: col.is_target || false
    })) || [],
    applied_constraints: schema.constraints?.length || 0,
    known_limitations: context.refinement_cycle >= 3 ? ['Dataset accepted after max refinement cycles (3)'] : []
  };
}

function generateReadme(context, metadata) {
  const lines = [
    `# ${metadata.dataset_name}`,
    '',
    `Generated by CODOZ | ${new Date().toLocaleDateString()}`,
    '',
    '## Topic',
    metadata.topic,
    '',
    '## Dataset Summary',
    `Rows: ${metadata.total_rows} | Columns: ${metadata.total_columns} | Task: ${metadata.task_type} | Target: ${metadata.target_column}`,
    '',
    '## Column Descriptions',
    ''
  ];
  
  for (const col of metadata.schema) {
    if (col.range) {
      lines.push(`- **${col.name}** (${col.dtype}): range [${col.range.join(', ')}]${col.is_target ? ' [TARGET]' : ''}`);
    } else if (col.categories) {
      lines.push(`- **${col.name}** (${col.dtype}): ${col.categories.join(', ')}${col.is_target ? ' [TARGET]' : ''}`);
    } else {
      lines.push(`- **${col.name}** (${col.dtype})${col.is_target ? ' [TARGET]' : ''}`);
    }
  }
  
  lines.push('');
  lines.push('## Quality');
  lines.push(`Score: ${metadata.final_quality_score.toFixed(1)}/100`);
  lines.push(`Refinement cycles: ${metadata.refinement_cycles_used}`);
  lines.push(`Schema source: ${metadata.schema_source}`);
  lines.push('');
  lines.push('## Label Distribution');
  for (const [label, count] of Object.entries(metadata.label_distribution || {})) {
    const pct = ((count / metadata.total_rows) * 100).toFixed(1);
    lines.push(`- ${label}: ${count} (${pct}%)`);
  }
  lines.push('');
  lines.push('## Usage');
  lines.push('This dataset is synthetically generated for ML training and research purposes.');
  lines.push('It is NOT derived from real individuals or organizations.');
  
  return lines.join('\n');
}

module.exports = { process: package };
