// ══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA MODULE
// Defines all table structures and validation rules
// ══════════════════════════════════════════════════════════════════════════════

const SCHEMA = {
  Clients: {
    name: 'Clients',
    headers: ['id', 'name', 'phone', 'email', 'city', 'category', 'source'],
    requiredFields: ['id', 'name'],
    description: 'Customer/Client records'
  },

  Suppliers: {
    name: 'Suppliers',
    headers: ['id', 'name', 'contact', 'phone', 'email', 'viber', 'type', 'notes'],
    requiredFields: ['id', 'name'],
    description: 'Supplier information'
  },

  Projects: {
    name: 'Projects',
    headers: [
      'id', 'clientId', 'code', 'title', 'address', 'date', 'status',
      'markup', 'windows', 'payments', 'extras', 'invoices', 'notes',
      'agreement', 'payPlan', 'kmWins', 'orders'
    ],
    requiredFields: ['id', 'clientId', 'code'],
    description: 'Project management'
  },

  StandaloneOrders: {
    name: 'StandaloneOrders',
    headers: ['id', 'code', 'type', 'supplierId', 'date', 'status', 'sentVia', 'rows', 'standalone'],
    requiredFields: ['id', 'code'],
    description: 'Standalone supplier orders'
  },

  Catalog: {
    name: 'Catalog',
    headers: ['series', 'pricePerKg', 'laborPerUnit', 'kasaCodes', 'fyloCodes', 'profileWeights'],
    requiredFields: ['series'],
    description: 'Aluminum product catalog'
  },

  Settings: {
    name: 'Settings',
    headers: ['key', 'value'],
    requiredFields: ['key'],
    description: 'Application settings'
  }
};

/**
 * Get schema for a table
 * @param {string} tableName - Table name
 * @return {object} Schema definition
 */
function getTableSchema(tableName) {
  if (!SCHEMA[tableName]) {
    throw new Error(`Unknown table: ${tableName}`);
  }
  return SCHEMA[tableName];
}

/**
 * Get all table names
 * @return {array} Table names
 */
function getAllTableNames() {
  return Object.keys(SCHEMA);
}

/**
 * Validate record against schema
 * @param {string} tableName - Table name
 * @param {object} record - Record to validate
 * @return {object} Validation result
 */
function validateRecord(tableName, record) {
  const schema = getTableSchema(tableName);
  const errors = [];

  // Check required fields
  for (const field of schema.requiredFields) {
    if (!record[field] || (typeof record[field] === 'string' && !record[field].trim())) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for unknown fields
  for (const field in record) {
    if (!schema.headers.includes(field)) {
      Logger.log(`Warning: Unknown field in ${tableName}: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get default values for a table
 * @param {string} tableName - Table name
 * @return {object} Default record template
 */
function getDefaultRecord(tableName) {
  const schema = getTableSchema(tableName);
  const defaults = {};

  for (const header of schema.headers) {
    defaults[header] = '';
  }

  return defaults;
}
