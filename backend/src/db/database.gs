// ══════════════════════════════════════════════════════════════════════════════
// DATABASE OPERATIONS MODULE
// CRUD operations and data persistence
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get Spreadsheet instance
 * @return {Spreadsheet} Google Spreadsheet
 */
function getSpreadsheet() {
  const sheetId = getConfig('SHEET_ID');
  if (!sheetId || !sheetId.trim()) {
    throw new Error('SHEET_ID not configured');
  }
  return SpreadsheetApp.openById(sheetId);
}

/**
 * Get or create sheet by name
 * @param {string} name - Sheet name
 * @return {Sheet} Sheet instance
 */
function getSheet(name) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      logInfo(`Created new sheet: ${name}`);
    }
    return sheet;
  } catch (error) {
    throw new Error(`Failed to get sheet "${name}": ${error.message}`);
  }
}

/**
 * Ensure sheet has proper headers
 * @param {string} tableName - Table name
 */
function ensureHeaders(tableName) {
  const schema = getTableSchema(tableName);
  const sheet = getSheet(schema.name);

  try {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schema.headers);
      logDebug(`Headers created for ${tableName}`);
      return;
    }

    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headersMatch = schema.headers.length === existing.length &&
      schema.headers.every((h, i) => h === existing[i]);

    if (!headersMatch) {
      logWarn(`Mismatched headers in ${tableName}, recreating...`);
      sheet.clear();
      sheet.appendRow(schema.headers);
    }
  } catch (error) {
    throw new Error(`Failed to ensure headers for ${tableName}: ${error.message}`);
  }
}

/**
 * Try to parse JSON value
 * @param {*} value - Value to parse
 * @return {*} Parsed or original value
 */
function tryParseJSON(value) {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  if (!v || !(v.startsWith('{') || v.startsWith('['))) return value;
  try {
    return JSON.parse(v);
  } catch (e) {
    return value;
  }
}

/**
 * Serialize value for storage
 * @param {*} value - Value to serialize
 * @return {string} Serialized value
 */
function serializeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Load all records from a table
 * @param {string} tableName - Table name
 * @return {array} Records
 */
function loadTable(tableName) {
  try {
    ensureHeaders(tableName);
    const schema = getTableSchema(tableName);
    const sheet = getSheet(schema.name);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return [];
    }

    const headers = data[0];
    const rows = data.slice(1);

    return rows
      .filter(row => row.some(cell => cell !== ''))
      .map(row => {
        const record = {};
        headers.forEach((header, i) => {
          record[header] = tryParseJSON(row[i]);
        });
        return record;
      });
  } catch (error) {
    logError(`Failed to load table ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Save a new record
 * @param {string} tableName - Table name
 * @param {object} record - Record to save
 * @return {object} Save result
 */
function createRecord(tableName, record) {
  try {
    const validation = validateRecord(tableName, record);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    ensureHeaders(tableName);
    const schema = getTableSchema(tableName);
    const sheet = getSheet(schema.name);
    const headers = schema.headers;

    const row = headers.map(header => serializeValue(record[header]));
    sheet.appendRow(row);

    logInfo(`Created record in ${tableName} with id: ${record.id}`);
    return { success: true, id: record.id };
  } catch (error) {
    logError(`Failed to create record in ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Update existing record
 * @param {string} tableName - Table name
 * @param {string} id - Record ID
 * @param {object} updates - Fields to update
 * @return {object} Update result
 */
function updateRecord(tableName, id, updates) {
  try {
    ensureHeaders(tableName);
    const schema = getTableSchema(tableName);
    const sheet = getSheet(schema.name);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      throw new Error('No records found');
    }

    const headers = data[0];
    const idCol = headers.indexOf('id');
    if (idCol === -1) {
      throw new Error('Missing id column');
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        headers.forEach((header, j) => {
          if (Object.prototype.hasOwnProperty.call(updates, header)) {
            sheet.getRange(i + 1, j + 1).setValue(serializeValue(updates[header]));
          }
        });
        logInfo(`Updated record in ${tableName} with id: ${id}`);
        return { success: true };
      }
    }

    throw new Error(`Record not found: ${id}`);
  } catch (error) {
    logError(`Failed to update record in ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a record
 * @param {string} tableName - Table name
 * @param {string} id - Record ID
 * @return {object} Delete result
 */
function deleteRecord(tableName, id) {
  try {
    ensureHeaders(tableName);
    const schema = getTableSchema(tableName);
    const sheet = getSheet(schema.name);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      throw new Error('No records found');
    }

    const headers = data[0];
    const idCol = headers.indexOf('id');
    if (idCol === -1) {
      throw new Error('Missing id column');
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        logInfo(`Deleted record from ${tableName} with id: ${id}`);
        return { success: true };
      }
    }

    throw new Error(`Record not found: ${id}`);
  } catch (error) {
    logError(`Failed to delete record from ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Clear all data from a table (keep headers)
 * @param {string} tableName - Table name
 */
function clearTable(tableName) {
  try {
    const schema = getTableSchema(tableName);
    const sheet = getSheet(schema.name);
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      logInfo(`Cleared table: ${tableName}`);
    }
  } catch (error) {
    logError(`Failed to clear table ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Initialize all database tables
 */
function initializeDatabase() {
  try {
    const tables = getAllTableNames();
    tables.forEach(tableName => {
      ensureHeaders(tableName);
    });

    // Seed initial data if empty
    seedInitialData();
    logInfo('Database initialized successfully');
    return { success: true };
  } catch (error) {
    logError(`Database initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Seed database with initial sample data
 */
function seedInitialData() {
  try {
    if (loadTable('Clients').length === 0) {
      createRecord('Clients', {
        id: 'c1',
        name: 'Νίκος Παπαδόπουλος',
        phone: '6941234567',
        email: 'nikos@mail.gr',
        city: 'Αθήνα',
        category: 'Ιδιώτης',
        source: 'Σύσταση'
      });
    }

    if (loadTable('Suppliers').length === 0) {
      createRecord('Suppliers', {
        id: 'sup1',
        name: 'Alumil ΑΕ',
        contact: 'Παπαδόπουλος Γ.',
        phone: '2310123456',
        email: 'orders@alumil.com',
        viber: '6941000001',
        type: 'Προφίλ',
        notes: ''
      });
    }

    logInfo('Initial data seeded');
  } catch (error) {
    logWarn(`Seed data issue: ${error.message}`);
  }
}
