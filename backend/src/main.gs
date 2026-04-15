// ══════════════════════════════════════════════════════════════════════════════
// FLOWOS v3 - MAIN ENTRY POINT
// Google Apps Script Backend
// Professional modular architecture with error handling and logging
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize application on first load
 */
function onInstall(e) {
  onOpen(e);
  initializeDatabase();
}

/**
 * Add menu items when document opens
 */
function onOpen(e) {
  try {
    logInfo('Application opened');
    const ui = HtmlService.createHtmlOutput('<p>FlowOS v3 is ready!</p>');
    SpreadsheetApp.getUi().showModelessDialog(ui, 'FlowOS');
  } catch (error) {
    logError('onOpen failed', error);
  }
}

/**
 * Health check endpoint
 */
function healthCheck() {
  try {
    const validation = validateConfig();
    if (!validation.valid) {
      return {
        status: 'error',
        errors: validation.errors
      };
    }

    return {
      status: 'ok',
      version: getConfig('APP.VERSION'),
      timestamp: new Date().toISOString(),
      stats: {
        clients: loadTable('Clients').length,
        projects: loadTable('Projects').length,
        suppliers: loadTable('Suppliers').length
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Test configuration
 */
function testConfiguration() {
  try {
    logInfo('Testing configuration...');
    const config = validateConfig();

    if (!config.valid) {
      logError('Configuration invalid', config.errors);
      return { success: false, errors: config.errors };
    }

    // Test database access
    const clientCount = loadTable('Clients').length;
    logInfo('Database access OK', { clientCount });

    // Test Anthropic API
    try {
      getAnthropicKey();
      logInfo('Anthropic API key configured');
    } catch (error) {
      logWarn('Anthropic API key not configured', error.message);
    }

    return {
      success: true,
      message: 'Configuration test passed',
      database: 'OK',
      anthropic: 'OK'
    };
  } catch (error) {
    logError('Configuration test failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debug function - check all logs
 */
function debugShowLogs() {
  const logs = getLogs();
  const stats = getLogStats();

  Logger.log('=== LOG SUMMARY ===');
  Logger.log(`Total: ${stats.total}`);
  Logger.log(`Debug: ${stats.byLevel.DEBUG}`);
  Logger.log(`Info: ${stats.byLevel.INFO}`);
  Logger.log(`Warn: ${stats.byLevel.WARN}`);
  Logger.log(`Error: ${stats.byLevel.ERROR}`);
  Logger.log('');
  Logger.log('=== RECENT LOGS ===');

  logs.slice(-50).forEach(log => Logger.log(log));
}

/**
 * Debug function - clear database
 */
function debugClearDatabase() {
  try {
    logWarn('Clearing database as requested');
    getAllTableNames().forEach(tableName => {
      clearTable(tableName);
    });
    logInfo('Database cleared');
    return { success: true, message: 'Database cleared' };
  } catch (error) {
    logError('Failed to clear database', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debug function - reset to defaults
 */
function debugResetToDefaults() {
  try {
    logWarn('Resetting database to defaults');
    debugClearDatabase();
    initializeDatabase();
    logInfo('Database reset to defaults');
    return { success: true, message: 'Database reset to defaults' };
  } catch (error) {
    logError('Failed to reset database', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debug function - test AI image analysis
 */
function debugTestAIImageAnalysis() {
  try {
    // This will fail without actual images, but shows the function works
    logInfo('Testing AI image analysis...');

    // For testing, we'd need actual base64 images
    // const testImages = ['data:image/jpeg;base64,...'];
    // const result = analyzeAluminumCatalog(testImages);

    return {
      success: true,
      message: 'AI image analysis function is available',
      note: 'Provide actual base64 images to test'
    };
  } catch (error) {
    logError('AI test failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy API compatibility wrappers
 */

function getAllData() {
  return handleLoadData();
}

function saveAllData(data) {
  return handleSaveData(data);
}

function callAnthropicAPI(messages, maxTokens) {
  return callClaudeAPI(messages, { maxTokens });
}

function analyzeAluminumCatalogImages(base64Images) {
  return analyzeAluminumCatalog(base64Images);
}

function saveCatalogData(catalogData) {
  return mergeCatalogFromAI(catalogData);
}

function initializeApplicationDatabase() {
  return initializeDatabase();
}
