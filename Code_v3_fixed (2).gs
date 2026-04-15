// ══════════════════════════════════════════════════════════════════════════════
// FlowOS v3 - Google Apps Script Backend
// Fixed for standalone script + direct Spreadsheet ID
// ══════════════════════════════════════════════════════════════════════════════

const SHEET_ID = '1OVTH2IUACpCdcmyvUV3FdUdmSHeKP3O-ALzafpUTP8g';

// ══════════════════════════════════════════════════════════════════════════════
// SPREADSHEET HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function getSpreadsheet() {
  if (!SHEET_ID || !SHEET_ID.trim()) {
    throw new Error('Missing SHEET_ID.');
  }
  return SpreadsheetApp.openById(SHEET_ID);
}

function getSheet(name) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// ══════════════════════════════════════════════════════════════════════════════
// WEB APP ENDPOINT
// ══════════════════════════════════════════════════════════════════════════════

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('FlowOS v3')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  const { action, table, data, id } = body;

  switch (action) {
    case 'load':   return ContentService.createTextOutput(JSON.stringify(loadData(table))).setMimeType(ContentService.MimeType.JSON);
    case 'save':   return ContentService.createTextOutput(JSON.stringify(saveData(table, data))).setMimeType(ContentService.MimeType.JSON);
    case 'update': return ContentService.createTextOutput(JSON.stringify(updateData(table, id, data))).setMimeType(ContentService.MimeType.JSON);
    case 'delete': return ContentService.createTextOutput(JSON.stringify(deleteData(table, id))).setMimeType(ContentService.MimeType.JSON);
    default:       return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// JSON HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function tryParseJSON(value) {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  if (!v) return value;
  if (!(v.startsWith('{') || v.startsWith('['))) return value;

  try {
    return JSON.parse(v);
  } catch (err) {
    return value;
  }
}

function serializeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

const TABLE_HEADERS = {
  Clients: ['id', 'name', 'phone', 'email', 'city', 'category', 'source'],
  Suppliers: ['id', 'name', 'contact', 'phone', 'email', 'viber', 'type', 'notes'],
  StandaloneOrders: ['id', 'code', 'type', 'supplierId', 'date', 'status', 'sentVia', 'rows', 'standalone'],
  Settings: ['key', 'value'],
  Catalog: ['series', 'pricePerKg', 'laborPerUnit', 'kasaCodes', 'fyloCodes', 'profileWeights'],
  Projects: [
    'id', 'clientId', 'code', 'title', 'address', 'date', 'status',
    'markup', 'windows', 'payments', 'extras', 'invoices', 'notes',
    'agreement', 'payPlan', 'kmWins', 'orders'
  ]
};

function ensureHeaders(sheet, table) {
  const expected = TABLE_HEADERS[table];
  if (!expected) return;

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expected);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const same = expected.length === existing.length && expected.every((h, i) => h === existing[i]);

  if (!same) {
    sheet.clear();
    sheet.appendRow(expected);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

function loadData(table) {
  const sheet = getSheet(table);
  ensureHeaders(sheet, table);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { data: [] };
  }

  const headers = data[0];
  const rows = data.slice(1);

  const records = rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const record = {};
      headers.forEach((header, i) => {
        record[header] = tryParseJSON(row[i]);
      });
      return record;
    });

  return { data: records };
}

function saveData(table, record) {
  const sheet = getSheet(table);
  ensureHeaders(sheet, table);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => serializeValue(record[header]));
  sheet.appendRow(row);

  return { success: true, id: record.id || null };
}

function updateData(table, id, updates) {
  const sheet = getSheet(table);
  ensureHeaders(sheet, table);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { error: 'No data found' };
  }

  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return { error: 'Missing id column' };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      headers.forEach((header, j) => {
        if (Object.prototype.hasOwnProperty.call(updates, header)) {
          sheet.getRange(i + 1, j + 1).setValue(serializeValue(updates[header]));
        }
      });
      return { success: true };
    }
  }

  return { error: 'Record not found' };
}

function deleteData(table, id) {
  const sheet = getSheet(table);
  ensureHeaders(sheet, table);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { error: 'No data found' };
  }

  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return { error: 'Missing id column' };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Record not found' };
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

function initializeDatabase() {
  const tables = ['Clients', 'Projects', 'Suppliers', 'Settings', 'Catalog', 'StandaloneOrders'];
  tables.forEach(name => {
    const sheet = getSheet(name);
    ensureHeaders(sheet, name);
  });

  // Settings
  const settingsSheet = getSheet('Settings');
  if (settingsSheet.getLastRow() <= 1) {
    const settingsRows = [
      ['companyName', 'ΑΛΟΥΜΙΝΙΑ ΑΕ'],
      ['address', 'Λεωφ. Κηφισίας 123'],
      ['city', 'Αθήνα'],
      ['afm', '999999999'],
      ['doy', 'Α\' Αθηνών'],
      ['phone', '210 1234567'],
      ['email', 'info@company.gr'],
      ['website', 'www.company.gr'],
      ['logo', '']
    ];
    settingsSheet.getRange(2, 1, settingsRows.length, 2).setValues(settingsRows);
  }

  // Clients
  const clientsSheet = getSheet('Clients');
  if (clientsSheet.getLastRow() <= 1) {
    clientsSheet.appendRow(['c1', 'Νίκος Παπαδόπουλος', '6941234567', 'nikos@mail.gr', 'Αθήνα', 'Ιδιώτης', 'Σύσταση']);
  }

  // Suppliers
  const suppliersSheet = getSheet('Suppliers');
  if (suppliersSheet.getLastRow() <= 1) {
    suppliersSheet.appendRow(['sup1', 'Alumil ΑΕ', 'Παπαδόπουλος Γ.', '2310123456', 'orders@alumil.com', '6941000001', 'Προφίλ', '']);
    suppliersSheet.appendRow(['sup2', 'Glasscorp', 'Νικολάου Α.', '2101234567', 'glass@glasscorp.gr', '6942000002', 'Τζάμια', '']);
    suppliersSheet.appendRow(['sup3', 'Rollotech', 'Σταματίου Κ.', '2310987654', 'info@rollotech.gr', '6943000003', 'Ρολά', '']);
  }

  // Catalog
  const catalogSheet = getSheet('Catalog');
  if (catalogSheet.getLastRow() <= 1) {
    const rows = [
      ['EOS60', 3.20, 45, JSON.stringify(['EOS60-K60','EOS60-K65']), JSON.stringify(['EOS60-F60','EOS60-F65']), JSON.stringify({K60:1.2,K65:1.4,F60:0.8,F65:0.9})],
      ['ESS34', 2.80, 40, JSON.stringify(['ESS34-K1']), JSON.stringify(['ESS34-F1']), JSON.stringify({K1:1.0,F1:0.7})],
      ['ESS47', 3.50, 50, JSON.stringify(['ESS47-K1']), JSON.stringify(['ESS47-F1']), JSON.stringify({K1:1.1,F1:0.8})],
      ['S77',   4.20, 65, JSON.stringify(['S77-K1','S77-K2']), JSON.stringify(['S77-F1']), JSON.stringify({K1:1.3,K2:1.5,F1:0.9})]
    ];
    catalogSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  // Projects
  const projectsSheet = getSheet('Projects');
  if (projectsSheet.getLastRow() <= 1) {
    const sampleProject = [
      'pr1',
      'c1',
      'PRJ-2026-001',
      'Αλλαγή κουφωμάτων σαλόνι',
      'Λεωφ. Αθηνών 12',
      new Date().toLocaleDateString('el-GR'),
      'premeasure',
      30,
      JSON.stringify([{
        id: 'w1',
        no: 1,
        height: '2.10',
        width: '1.20',
        type: 'ΑΝΟΙΓΟΜΕΝΟ',
        series: 'EOS60',
        typology: 'ΜΟΝΟΦΥΛΛΟ',
        glass: '4+16+4',
        color: 'Λευκό RAL9016',
        rolo: '—',
        kanali: '—',
        boxH: '',
        motor: '—',
        anoigma: '—',
        prebazi: 'none',
        notes: '',
        kasaCode: 'EOS60-K60',
        fyloCode: 'EOS60-F60'
      }]),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      '',
      JSON.stringify({ net: '', vatPct: '24' }),
      JSON.stringify([
        { id: 'pp1', stage: 'Προκαταβολή', pct: 50 },
        { id: 'pp2', stage: 'Αρχή τοποθέτησης', pct: 20 },
        { id: 'pp3', stage: 'Αποπεράτωση', pct: 30 }
      ]),
      JSON.stringify([]),
      JSON.stringify([])
    ];
    projectsSheet.appendRow(sampleProject);
  }

  Logger.log('✓ Database initialized successfully');
  return { success: true, message: 'Database initialized successfully' };
}

// Continue with rest of functions...
// (getAllData, saveAllData, loadSettings, etc. - same as in your document)

function getAllData() {
  return {
    clients: loadData('Clients').data || [],
    projects: loadData('Projects').data || [],
    suppliers: loadData('Suppliers').data || [],
    settings: loadSettings(),
    catalog: loadCatalog(),
    standaloneOrders: loadData('StandaloneOrders').data || []
  };
}

function saveAllData(data) {
  saveClients(data.clients || []);
  saveProjects(data.projects || []);
  saveSuppliers(data.suppliers || []);
  saveStandaloneOrders(data.standaloneOrders || []);
  saveSettings(data.settings || {});
  saveCatalog(data.catalog || { series: {}, profileWeights: {} });

  return { success: true };
}

function saveClients(clients) {
  const sheet = getSheet('Clients');
  sheet.clear();
  ensureHeaders(sheet, 'Clients');

  clients.forEach(client => {
    sheet.appendRow(TABLE_HEADERS.Clients.map(h => serializeValue(client[h])));
  });
}

function saveProjects(projects) {
  const sheet = getSheet('Projects');
  sheet.clear();
  ensureHeaders(sheet, 'Projects');

  projects.forEach(project => {
    sheet.appendRow(TABLE_HEADERS.Projects.map(h => serializeValue(project[h])));
  });
}

function saveSuppliers(suppliers) {
  const sheet = getSheet('Suppliers');
  sheet.clear();
  ensureHeaders(sheet, 'Suppliers');

  suppliers.forEach(supplier => {
    sheet.appendRow(TABLE_HEADERS.Suppliers.map(h => serializeValue(supplier[h])));
  });
}

function saveStandaloneOrders(orders) {
  const sheet = getSheet('StandaloneOrders');
  sheet.clear();
  ensureHeaders(sheet, 'StandaloneOrders');

  orders.forEach(order => {
    sheet.appendRow(TABLE_HEADERS.StandaloneOrders.map(h => serializeValue(order[h])));
  });
}

function loadSettings() {
  const sheet = getSheet('Settings');
  ensureHeaders(sheet, 'Settings');

  const data = sheet.getDataRange().getValues();
  const settings = {};

  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = tryParseJSON(data[i][1]);
    if (key) settings[key] = value;
  }

  return settings;
}

function saveSettings(settings) {
  const sheet = getSheet('Settings');
  sheet.clear();
  ensureHeaders(sheet, 'Settings');

  Object.keys(settings).forEach(key => {
    sheet.appendRow([key, serializeValue(settings[key])]);
  });
}

function loadCatalog() {
  const sheet = getSheet('Catalog');
  ensureHeaders(sheet, 'Catalog');

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { series: {}, profileWeights: {} };
  }

  const catalog = { series: {}, profileWeights: {} };

  for (let i = 1; i < data.length; i++) {
    const seriesName = data[i][0];
    if (!seriesName) continue;

    catalog.series[seriesName] = {
      pricePerKg: Number(data[i][1] || 0),
      laborPerUnit: Number(data[i][2] || 0),
      kasaCodes: tryParseJSON(data[i][3]) || [],
      fyloCodes: tryParseJSON(data[i][4]) || []
    };

    const weights = tryParseJSON(data[i][5]) || {};
    Object.assign(catalog.profileWeights, weights);
  }

  return catalog;
}

function saveCatalog(catalog) {
  const sheet = getSheet('Catalog');
  sheet.clear();
  ensureHeaders(sheet, 'Catalog');

  const series = catalog.series || {};
  const profileWeights = catalog.profileWeights || {};

  Object.keys(series).forEach(seriesName => {
    const s = series[seriesName];
    sheet.appendRow([
      seriesName,
      s.pricePerKg || 0,
      s.laborPerUnit || 0,
      JSON.stringify(s.kasaCodes || []),
      JSON.stringify(s.fyloCodes || []),
      JSON.stringify(profileWeights || {})
    ]);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ANTHROPIC API
// ══════════════════════════════════════════════════════════════════════════════

function getAnthropicKey() {
  return PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || '';
}

function callAnthropicAPI(messages, maxTokens) {
  const apiKey = getAnthropicKey();

  if (!apiKey) {
    return { error: 'Missing ANTHROPIC_API_KEY in Script Properties.' };
  }

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 1000,
        messages: messages
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      Logger.log('Anthropic API Error: ' + JSON.stringify(result.error));
      return { error: result.error.message };
    }

    return result;
  } catch (error) {
    Logger.log('API Call Error: ' + error.toString());
    return { error: error.toString() };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF GENERATION & GOOGLE DRIVE
// ══════════════════════════════════════════════════════════════════════════════

function savePDFtoDrive(htmlContent, filename) {
  try {
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    const pdf = blob.getAs('application/pdf');
    pdf.setName(filename);

    const folders = DriveApp.getFoldersByName('FlowOS_Documents');
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('FlowOS_Documents');

    const file = folder.createFile(pdf);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      id: file.getId(),
      url: file.getUrl(),
      name: filename,
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
    };
  } catch (error) {
    Logger.log('savePDFtoDrive Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function sendEmailWithPDF(to, subject, body, htmlContent, filename) {
  try {
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    const pdf = blob.getAs('application/pdf');
    pdf.setName(filename);

    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body,
      attachments: [pdf]
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    Logger.log('sendEmailWithPDF Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function generateViberLink(phone, message) {
  const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message || '');
  return `viber://forward?text=${encodedMessage}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// AI CATALOG SCANNER - Batch Image Analysis
// ══════════════════════════════════════════════════════════════════════════════

function analyzeAluminumCatalogImages(base64Images) {
  const apiKey = getAnthropicKey();

  if (!apiKey) {
    return { error: 'Missing ANTHROPIC_API_KEY in Script Properties.' };
  }

  if (!Array.isArray(base64Images) || base64Images.length === 0) {
    return { error: 'No images provided' };
  }

  try {
    const imageContent = base64Images.map(base64 => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64
      }
    }));

    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Analyze these aluminum window/door catalog images and extract ALL product data in JSON format.

Extract and organize:
{
  "series": [
    {"name": "EOS60", "description": "...", "type": "profile"}
  ],
  "typologies": ["ΜΟΝΟΦΥΛΛΟ", "ΔΙΦΥΛΛΟ", ...],
  "frames": [
    {"code": "EOS60-K60", "series": "EOS60", "description": "..."}
  ],
  "sashes": [
    {"code": "EOS60-F60", "series": "EOS60", "description": "..."}
  ],
  "accessories": [
    {"name": "Μεντεσέδες", "description": "..."}
  ],
  "glass_types": ["4+16+4", "Low-E", ...],
  "colors": ["Λευκό RAL9016", "Ανθρακί RAL7016", ...],
  "pricing": [
    {"series": "EOS60", "type": "labor_per_unit", "value": 45}
  ]
}

Be thorough and extract ALL visible information. Return ONLY valid JSON.`
            }
          ]
        }]
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      Logger.log('Anthropic API Error: ' + JSON.stringify(result.error));
      return { error: result.error.message };
    }

    const textContent = result.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      success: true,
      data: extractedData,
      imageCount: base64Images.length
    };
  } catch (error) {
    Logger.log('analyzeAluminumCatalogImages Error: ' + error.toString());
    return { error: error.toString() };
  }
}

function saveCatalogData(catalogData) {
  try {
    const catalog = loadCatalog();

    // Merge series
    if (catalogData.series) {
      catalogData.series.forEach(s => {
        if (!catalog.series[s.name]) {
          catalog.series[s.name] = {
            pricePerKg: 0,
            laborPerUnit: 0,
            kasaCodes: [],
            fyloCodes: []
          };
        }
      });
    }

    // Add frames (kasaCodes)
    if (catalogData.frames) {
      catalogData.frames.forEach(f => {
        const series = f.series;
        if (series && catalog.series[series]) {
          if (!catalog.series[series].kasaCodes.includes(f.code)) {
            catalog.series[series].kasaCodes.push(f.code);
          }
        }
      });
    }

    // Add sashes (fyloCodes)
    if (catalogData.sashes) {
      catalogData.sashes.forEach(s => {
        const series = s.series;
        if (series && catalog.series[series]) {
          if (!catalog.series[series].fyloCodes.includes(s.code)) {
            catalog.series[series].fyloCodes.push(s.code);
          }
        }
      });
    }

    // Update pricing
    if (catalogData.pricing) {
      catalogData.pricing.forEach(p => {
        if (p.series && catalog.series[p.series]) {
          if (p.type === 'labor_per_unit') {
            catalog.series[p.series].laborPerUnit = p.value;
          } else if (p.type === 'price_per_kg') {
            catalog.series[p.series].pricePerKg = p.value;
          }
        }
      });
    }

    saveCatalog(catalog);
    return { success: true, message: 'Catalog data saved successfully' };
  } catch (error) {
    Logger.log('saveCatalogData Error: ' + error.toString());
    return { error: error.toString() };
  }
}
