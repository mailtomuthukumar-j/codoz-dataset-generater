/**
 * Environment Configuration
 * Loads .env file and provides configuration values
 */

const nodeFs = require('fs');
const nodePath = require('path');
const nodeProcess = require('process');

const CONFIG = {
  outputFolder: 'codoz set',
  kaggle: {
    configPath: '.kaggle/kaggle.json'
  },
  huggingface: {
    apiKeyEnv: 'HUGGINGFACE_API_KEY'
  },
  dataGov: {
    apiKeyEnv: 'DATA_GOV_API_KEY'
  }
};

function loadEnv() {
  const cwd = nodeProcess.cwd();
  const envPath = nodePath.join(cwd, '.env');
  
  if (nodeFs.existsSync(envPath)) {
    try {
      const content = nodeFs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            let value = trimmed.substring(eqIndex + 1).trim();
            
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            if (!nodeProcess.env[key]) {
              nodeProcess.env[key] = value;
            }
          }
        }
      });
      
      if (nodeProcess.env.OUTPUT_FOLDER) {
        CONFIG.outputFolder = nodeProcess.env.OUTPUT_FOLDER;
      }
    } catch (error) {
      console.warn('Warning: Could not load .env file:', error.message);
    }
  }
}

function getOutputFolder() {
  return CONFIG.outputFolder;
}

function isKaggleAvailable() {
  const homeDir = nodeProcess.env.HOME || nodeProcess.env.USERPROFILE || '';
  const kagglePath = nodePath.join(homeDir, '.kaggle', 'kaggle.json');
  
  if (nodeFs.existsSync(kagglePath)) {
    return true;
  }
  
  if (nodeProcess.env.KAGGLE_USERNAME && nodeProcess.env.KAGGLE_KEY) {
    return true;
  }
  
  return false;
}

function isHuggingFaceAvailable() {
  return !!nodeProcess.env.HUGGINGFACE_API_KEY;
}

function isDataGovAvailable() {
  return true;
}

function getKaggleCredentials() {
  const homeDir = nodeProcess.env.HOME || nodeProcess.env.USERPROFILE || '';
  const kagglePath = nodePath.join(homeDir, '.kaggle', 'kaggle.json');
  
  if (nodeFs.existsSync(kagglePath)) {
    try {
      const content = nodeFs.readFileSync(kagglePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  if (nodeProcess.env.KAGGLE_USERNAME && nodeProcess.env.KAGGLE_KEY) {
    return {
      username: nodeProcess.env.KAGGLE_USERNAME,
      key: nodeProcess.env.KAGGLE_KEY
    };
  }
  
  return null;
}

function getHuggingFaceKey() {
  return nodeProcess.env.HUGGINGFACE_API_KEY || null;
}

function checkApiKeys() {
  const status = {
    kaggle: isKaggleAvailable(),
    huggingface: isHuggingFaceAvailable(),
    dataGov: isDataGovAvailable()
  };
  
  const missing = [];
  if (!status.kaggle) missing.push('KAGGLE_USERNAME/KAGGLE_KEY');
  if (!status.huggingface) missing.push('HUGGINGFACE_API_KEY');
  
  return { status, missing, allPresent: missing.length === 0 };
}

loadEnv();

module.exports = {
  CONFIG,
  loadEnv,
  getOutputFolder,
  isKaggleAvailable,
  isHuggingFaceAvailable,
  isDataGovAvailable,
  getKaggleCredentials,
  getHuggingFaceKey,
  checkApiKeys
};
