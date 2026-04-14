const { DOMAIN_SCHEMAS } = require('./analyzer');

function build(topicAnalysis) {
  const schemaName = topicAnalysis.schema;
  const baseSchema = DOMAIN_SCHEMAS[schemaName] || DOMAIN_SCHEMAS.default;
  
  return {
    name: schemaName,
    domain: baseSchema.domain,
    columns: baseSchema.columns,
    correlations: baseSchema.correlations,
    topic: topicAnalysis.topic,
    matchConfidence: topicAnalysis.matchConfidence
  };
}

module.exports = { build };
