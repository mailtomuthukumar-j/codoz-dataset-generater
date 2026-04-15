/**
 * CODOZ Validator Agent
 * Validates dataset consistency and logical integrity
 * Parses _derivation field to verify labels are rule-derived
 */

const { getDomainBlueprintForTopic } = require('../core/domain-detector');
const { validateRow, evaluateIndicator } = require('../core/domain-rules-engine');

function validateDataset(dataset, topic, options = {}) {
  const blueprint = getDomainBlueprintForTopic(topic);
  
  if (!blueprint) {
    return {
      valid: true,
      score: 100,
      message: 'No blueprint available for validation',
      issues: []
    };
  }
  
  const issues = [];
  let validRows = 0;
  let invalidRows = 0;
  
  for (let i = 0; i < dataset.length; i++) {
    const row = dataset[i];
    const rowIssues = validateRowFull(blueprint, row, i);
    
    if (rowIssues.length > 0) {
      invalidRows++;
      issues.push(...rowIssues);
    } else {
      validRows++;
    }
  }
  
  const score = dataset.length > 0 ? (validRows / dataset.length) * 100 : 0;
  
  return {
    valid: score >= 80,
    score: parseFloat(score.toFixed(2)),
    totalRows: dataset.length,
    validRows,
    invalidRows,
    issues: issues.slice(0, 20),
    message: invalidRows === 0 
      ? 'All rows passed validation' 
      : `${invalidRows} rows failed validation`
  };
}

function validateRowFull(blueprint, row, index) {
  const issues = [];
  
  if (!row._derivation && !row.hasOwnProperty('_derivation')) {
    issues.push({
      row: index,
      type: 'missing_derivation',
      message: `Row ${index}: No _derivation field - label may not be rule-derived`
    });
  }
  
  const validation = validateRow(blueprint, row);
  
  if (!validation.valid) {
    for (const violation of validation.violations) {
      issues.push({
        row: index,
        type: violation.type,
        column: violation.column,
        message: `Row ${index}: ${violation.message}`
      });
    }
  }
  
  if (blueprint.contradictions) {
    for (const rule of blueprint.contradictions) {
      if (rule.invalid) {
        const result = evaluateIndicator(rule.condition, row, row);
        if (result) {
          issues.push({
            row: index,
            type: 'contradiction',
            condition: rule.condition,
            message: `Row ${index}: Logical contradiction detected - ${rule.condition}`
          });
        }
      }
    }
  }
  
  const labelValidation = validateLabelDerivation(blueprint, row);
  if (!labelValidation.valid) {
    issues.push({
      row: index,
      type: 'label_mismatch',
      message: `Row ${index}: ${labelValidation.message}`
    });
  }
  
  return issues;
}

function validateLabelDerivation(blueprint, row) {
  const targetField = blueprint.target;
  const label = row[targetField];
  
  const matchingRules = blueprint.labelRules.filter(rule => {
    return rule.target === label;
  });
  
  if (matchingRules.length === 0) {
    return {
      valid: false,
      message: `Label "${label}" has no matching rules`
    };
  }
  
  let hasSupportingEvidence = false;
  
  for (const rule of matchingRules) {
    const evidenceCount = rule.indicators.filter(indicator => {
      return evaluateIndicator(indicator, row, row);
    }).length;
    
    if (evidenceCount > 0) {
      hasSupportingEvidence = true;
      break;
    }
  }
  
  return {
    valid: hasSupportingEvidence,
    message: hasSupportingEvidence 
      ? 'Label has supporting feature evidence' 
      : `Label "${label}" has no supporting feature evidence`
  };
}

function validateFeatureUniqueness(dataset) {
  const issues = [];
  
  if (dataset.length < 2) return { valid: true, issues };
  
  const featureNames = Object.keys(dataset[0]).filter(k => !k.startsWith('_') && k !== 'id');
  
  for (const feature of featureNames) {
    const values = dataset.map(r => r[feature]);
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size === 1) {
      issues.push({
        type: 'no_variance',
        column: feature,
        message: `Column "${feature}" has no variance - all values identical`
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function validateLabelDistribution(dataset, blueprint) {
  const targetField = blueprint?.target;
  if (!targetField) return { valid: true, issues: [] };
  
  const labelCounts = {};
  dataset.forEach(row => {
    const label = row[targetField];
    labelCounts[label] = (labelCounts[label] || 0) + 1;
  });
  
  const total = dataset.length;
  const issues = [];
  
  for (const [label, count] of Object.entries(labelCounts)) {
    const pct = (count / total) * 100;
    
    if (pct < 1) {
      issues.push({
        type: 'extreme_imbalance',
        label,
        percentage: pct.toFixed(2),
        message: `Label "${label}" is extremely rare (${pct.toFixed(2)}%)`
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    distribution: labelCounts,
    issues
  };
}

function process(context) {
  const { dataset, topic, silent } = context;
  
  if (!dataset || dataset.length === 0) {
    return {
      ...context,
      validationResult: {
        valid: false,
        score: 0,
        message: 'Empty dataset'
      }
    };
  }
  
  const blueprint = getDomainBlueprintForTopic(topic);
  
  const datasetValidation = validateDataset(dataset, topic);
  const uniquenessValidation = validateFeatureUniqueness(dataset);
  const distributionValidation = validateLabelDistribution(dataset, blueprint);
  
  const allIssues = [
    ...datasetValidation.issues,
    ...uniquenessValidation.issues,
    ...distributionValidation.issues
  ];
  
  const finalScore = calculateOverallScore(
    datasetValidation,
    uniquenessValidation,
    distributionValidation
  );
  
  if (!silent) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  VALIDATION RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`  Overall Score: ${finalScore.toFixed(1)}%\n`);
    
    if (allIssues.length > 0) {
      console.log('  Issues found:');
      allIssues.slice(0, 5).forEach(issue => {
        console.log(`    • ${issue.message}`);
      });
      if (allIssues.length > 5) {
        console.log(`    ... and ${allIssues.length - 5} more issues`);
      }
    } else {
      console.log('  ✓ All validation checks passed');
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
  }
  
  return {
    ...context,
    validationResult: {
      valid: datasetValidation.valid && uniquenessValidation.valid && distributionValidation.valid,
      score: finalScore,
      datasetValidation,
      uniquenessValidation,
      distributionValidation,
      allIssues,
      message: allIssues.length === 0 
        ? 'Dataset passed all validation checks'
        : `${allIssues.length} issues found`
    }
  };
}

function calculateOverallScore(...validations) {
  const weights = {
    dataset: 0.5,
    uniqueness: 0.25,
    distribution: 0.25
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  validations.forEach((validation, index) => {
    const weight = Object.values(weights)[index];
    const score = validation.valid ? 100 : 0;
    totalScore += score * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

module.exports = { 
  process,
  validateDataset,
  validateRowFull,
  validateFeatureUniqueness,
  validateLabelDistribution,
  validateLabelDerivation
};
