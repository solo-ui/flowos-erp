// ══════════════════════════════════════════════════════════════════════════════
// API ROUTES MODULE
// HTTP endpoint handlers for REST API
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Handle GET requests (HTML page)
 * @param {object} e - Event object
 * @return {HtmlOutput} HTML output
 */
function doGet(e) {
  try {
    logInfo('GET request received');
    const html = HtmlService.createHtmlOutputFromFile('index')
      .setTitle(getConfig('APP.TITLE'))
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return html;
  } catch (error) {
    logError('doGet failed', error);
    return HtmlService.createHtmlOutput(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Application Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
}

/**
 * Handle POST requests (API)
 * @param {object} e - Event object
 * @return {TextOutput} JSON response
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    logDebug('POST request', { action: body.action });

    const response = routeRequest(body);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Route request to appropriate handler
 * @param {object} body - Request body
 * @return {object} Response
 */
function routeRequest(body) {
  const { action, table, data, id } = body;

  switch (action) {
    // Database CRUD
    case 'CREATE':
      return handleCreate(table, data);
    case 'READ':
      return handleRead(table, id);
    case 'UPDATE':
      return handleUpdate(table, id, data);
    case 'DELETE':
      return handleDelete(table, id);
    case 'LIST':
      return handleList(table);

    // Data operations
    case 'loadData':
      return handleLoadData();
    case 'saveData':
      return handleSaveData(data);

    // Catalog operations
    case 'getCatalog':
      return handleGetCatalog();
    case 'mergeCatalog':
      return handleMergeCatalog(data);
    case 'analyzeCatalogImages':
      return handleAnalyzeCatalogImages(data);

    // AI operations
    case 'generateText':
      return handleGenerateText(data);

    // System operations
    case 'initializeDatabase':
      return handleInitializeDatabase();
    case 'getLogs':
      return handleGetLogs();
    case 'getStats':
      return handleGetStats();

    default:
      throw new AppError(`Unknown action: ${action}`, 'UNKNOWN_ACTION', 400);
  }
}

/**
 * Handle CREATE request
 */
function handleCreate(table, data) {
  validateRequired({ table, data }, ['table', 'data']);
  const result = createRecord(table, data);
  return { success: true, ...result };
}

/**
 * Handle READ request
 */
function handleRead(table, id) {
  validateRequired({ table, id }, ['table', 'id']);
  const records = loadTable(table);
  const record = records.find(r => String(r.id) === String(id));

  if (!record) {
    throw new NotFoundError(table, id);
  }

  return { success: true, data: record };
}

/**
 * Handle UPDATE request
 */
function handleUpdate(table, id, data) {
  validateRequired({ table, id, data }, ['table', 'id', 'data']);
  const result = updateRecord(table, id, data);
  return { success: true, ...result };
}

/**
 * Handle DELETE request
 */
function handleDelete(table, id) {
  validateRequired({ table, id }, ['table', 'id']);
  const result = deleteRecord(table, id);
  return { success: true, ...result };
}

/**
 * Handle LIST request
 */
function handleList(table) {
  validateRequired({ table }, ['table']);
  const data = loadTable(table);
  return { success: true, data };
}

/**
 * Handle loadData request (full database dump)
 */
function handleLoadData() {
  return {
    success: true,
    data: {
      clients: loadTable('Clients'),
      projects: loadTable('Projects'),
      suppliers: loadTable('Suppliers'),
      settings: loadSettings(),
      catalog: loadCatalogData(),
      standaloneOrders: loadTable('StandaloneOrders')
    }
  };
}

/**
 * Handle saveData request (full database update)
 */
function handleSaveData(data) {
  validateRequired({ data }, ['data']);

  if (data.clients) clearTable('Clients');
  if (data.projects) clearTable('Projects');
  if (data.suppliers) clearTable('Suppliers');
  if (data.standaloneOrders) clearTable('StandaloneOrders');

  if (data.clients) {
    data.clients.forEach(record => createRecord('Clients', record));
  }
  if (data.projects) {
    data.projects.forEach(record => createRecord('Projects', record));
  }
  if (data.suppliers) {
    data.suppliers.forEach(record => createRecord('Suppliers', record));
  }
  if (data.standaloneOrders) {
    data.standaloneOrders.forEach(record => createRecord('StandaloneOrders', record));
  }
  if (data.settings) {
    saveSettings(data.settings);
  }
  if (data.catalog) {
    saveCatalogData(data.catalog);
  }

  return { success: true, message: 'All data saved successfully' };
}

/**
 * Handle getCatalog request
 */
function handleGetCatalog() {
  const catalog = loadCatalogData();
  return { success: true, data: catalog };
}

/**
 * Handle mergeCatalog request
 */
function handleMergeCatalog(aiData) {
  validateRequired({ aiData }, ['aiData']);
  const result = mergeCatalogFromAI(aiData);
  return { success: true, ...result };
}

/**
 * Handle analyzeCatalogImages request
 */
function handleAnalyzeCatalogImages(data) {
  validateRequired(data, ['images']);
  const result = analyzeAluminumCatalog(data.images);
  return result;
}

/**
 * Handle generateText request
 */
function handleGenerateText(data) {
  validateRequired(data, ['prompt']);
  const text = generateText(data.prompt, {
    maxTokens: data.maxTokens || 1000
  });
  return { success: true, text };
}

/**
 * Handle initializeDatabase request
 */
function handleInitializeDatabase() {
  const result = initializeDatabase();
  return { success: true, ...result };
}

/**
 * Handle getLogs request
 */
function handleGetLogs() {
  const logs = getLogs();
  return { success: true, logs, stats: getLogStats() };
}

/**
 * Handle getStats request
 */
function handleGetStats() {
  return {
    success: true,
    stats: {
      clients: loadTable('Clients').length,
      projects: loadTable('Projects').length,
      suppliers: loadTable('Suppliers').length,
      orders: loadTable('StandaloneOrders').length,
      logs: getLogStats()
    }
  };
}

/**
 * Load application settings
 */
function loadSettings() {
  try {
    ensureHeaders('Settings');
    const records = loadTable('Settings');
    const settings = {};

    records.forEach(record => {
      if (record.key) {
        settings[record.key] = tryParseJSON(record.value);
      }
    });

    return settings;
  } catch (error) {
    logError('Failed to load settings', error);
    return {};
  }
}

/**
 * Save application settings
 */
function saveSettings(settings) {
  try {
    clearTable('Settings');
    Object.keys(settings).forEach(key => {
      createRecord('Settings', {
        key: key,
        value: serializeValue(settings[key])
      });
    });
    logInfo('Settings saved');
  } catch (error) {
    logError('Failed to save settings', error);
    throw error;
  }
}
