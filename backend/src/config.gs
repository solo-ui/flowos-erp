// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION MODULE
// FlowOS v3 - Centralized configuration management
// ══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Google Sheets Configuration
  SHEET_ID: '1OVTH2IUACpCdcmyvUV3FdUdmSHeKP3O-ALzafpUTP8g',

  // API Configuration
  API: {
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com/v1/messages',
    ANTHROPIC_VERSION: '2023-06-01',
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 4096,
    TIMEOUT: 30000
  },

  // App Configuration
  APP: {
    NAME: 'FlowOS v3',
    TITLE: 'FlowOS - Aluminum ERP System',
    VERSION: '3.0.0',
    XFRAME_MODE: 'ALLOWALL'
  },

  // Storage Configuration
  STORAGE: {
    DRIVE_FOLDER: 'FlowOS_Documents',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
  },

  // Feature Flags
  FEATURES: {
    AI_SCANNER: true,
    PDF_EXPORT: true,
    EMAIL_INTEGRATION: true,
    VIBER_INTEGRATION: true
  },

  // Logging Configuration
  LOGGING: {
    ENABLED: true,
    LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
    MAX_LOGS: 1000
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Config path (e.g., 'API.ANTHROPIC_BASE_URL')
 * @param {*} defaultValue - Default value if path not found
 * @return {*} Configuration value
 */
function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = CONFIG;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Get Anthropic API Key from Script Properties
 * @return {string} API key
 */
function getAnthropicKey() {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key || !key.trim()) {
    throw new Error('ANTHROPIC_API_KEY not set in Script Properties. Configure it in Project Settings.');
  }
  return key;
}

/**
 * Validate configuration
 * @return {object} Validation result
 */
function validateConfig() {
  const errors = [];

  if (!CONFIG.SHEET_ID || !CONFIG.SHEET_ID.trim()) {
    errors.push('SHEET_ID is not configured');
  }

  try {
    getAnthropicKey();
  } catch (e) {
    errors.push('ANTHROPIC_API_KEY is not configured');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}
