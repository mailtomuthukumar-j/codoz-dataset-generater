/**
 * Data.gov Source Adapter
 * Fetches datasets from US Data.gov
 */

const axios = require('axios');
const logger = require('../utils/logger');

const DATA_GOV_API = 'https://catalog.data.gov/api/3/action';

const DOMAIN_DATASETS = {
  health: {
    query: 'healthcare',
    limit: 20
  },
  finance: {
    query: 'finance',
    limit: 20
  },
  education: {
    query: 'education',
    limit: 20
  },
  transportation: {
    query: 'transportation',
    limit: 20
  },
  census: {
    query: 'census',
    limit: 20
  }
};

function isAvailable() {
  return true;
}

async function fetch(domain, options = {}) {
  const domainConfig = DOMAIN_DATASETS[domain] || { query: domain, limit: 20 };
  
  try {
    const searchResponse = await axios.get(
      `${DATA_GOV_API}/package_search`,
      {
        params: {
          q: domainConfig.query,
          rows: domainConfig.limit
        },
        timeout: 30000
      }
    );
    
    const packages = searchResponse.data.result?.results || [];
    
    if (packages.length === 0) {
      throw new Error(`No datasets found for domain: ${domain}`);
    }
    
    const resources = [];
    
    for (const pkg of packages.slice(0, 5)) {
      if (pkg.resources && pkg.resources.length > 0) {
        const csvResource = pkg.resources.find(r => 
          r.format?.toLowerCase() === 'csv' || 
          r.url?.endsWith('.csv')
        ) || pkg.resources[0];
        
        resources.push({
          package: pkg,
          resource: csvResource
        });
      }
    }
    
    if (resources.length === 0) {
      throw new Error('No downloadable resources found');
    }
    
    const allRows = [];
    
    for (const { package: pkg, resource } of resources) {
      try {
        if (resource.url && (resource.format?.toLowerCase() === 'csv' || resource.url.endsWith('.csv'))) {
          const rows = await fetchResource(resource.url);
          if (rows.length > 0) {
            rows.forEach(row => {
              row._dataset = pkg.title || pkg.name;
              row._organization = pkg.organization?.title || '';
            });
            allRows.push(...rows);
          }
        }
      } catch (error) {
        logger.warn(`Failed to fetch resource ${resource.url}: ${error.message}`);
      }
    }
    
    logger.info(`Data.gov: Fetched ${allRows.length} rows for ${domain}`);
    
    return {
      rows: allRows,
      source: 'data.gov',
      domain,
      datasets: resources.map(r => r.package.name),
      rowCount: allRows.length
    };
  } catch (error) {
    logger.error(`Data.gov fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchResource(url) {
  const response = await axios.get(url, { timeout: 60000 });
  
  const content = response.data;
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length * 0.5) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h?.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function searchDatasets(query) {
  try {
    const response = await axios.get(
      `${DATA_GOV_API}/package_search`,
      {
        params: {
          q: query,
          rows: 10
        },
        timeout: 30000
      }
    );
    
    return (response.data.result?.results || []).map(pkg => ({
      name: pkg.name,
      title: pkg.title,
      resources: pkg.resources?.length || 0,
      organization: pkg.organization?.title || 'Unknown'
    }));
  } catch (error) {
    logger.warn(`Data.gov search failed: ${error.message}`);
    return [];
  }
}

module.exports = { fetch, searchDatasets, isAvailable, DOMAIN_DATASETS };
