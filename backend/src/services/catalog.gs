// ══════════════════════════════════════════════════════════════════════════════
// CATALOG SERVICE MODULE
// Aluminum product catalog management
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Load catalog data
 * @return {object} Catalog structure
 */
function loadCatalogData() {
  try {
    const records = loadTable('Catalog');
    const catalog = {
      series: {},
      profileWeights: {}
    };

    records.forEach(record => {
      const seriesName = record.series;
      if (!seriesName) return;

      catalog.series[seriesName] = {
        pricePerKg: Number(record.pricePerKg || 0),
        laborPerUnit: Number(record.laborPerUnit || 0),
        kasaCodes: tryParseJSON(record.kasaCodes) || [],
        fyloCodes: tryParseJSON(record.fyloCodes) || []
      };

      const weights = tryParseJSON(record.profileWeights) || {};
      Object.assign(catalog.profileWeights, weights);
    });

    logDebug('Catalog loaded', {
      seriesCount: Object.keys(catalog.series).length,
      profileCount: Object.keys(catalog.profileWeights).length
    });

    return catalog;
  } catch (error) {
    logError('Failed to load catalog', error);
    throw error;
  }
}

/**
 * Save catalog data
 * @param {object} catalog - Catalog object
 */
function saveCatalogData(catalog) {
  try {
    validateRequired({ catalog }, ['catalog']);

    const series = catalog.series || {};
    const profileWeights = catalog.profileWeights || {};

    // Clear existing catalog
    clearTable('Catalog');

    // Insert new records
    Object.keys(series).forEach(seriesName => {
      const s = series[seriesName];
      createRecord('Catalog', {
        series: seriesName,
        pricePerKg: s.pricePerKg || 0,
        laborPerUnit: s.laborPerUnit || 0,
        kasaCodes: JSON.stringify(s.kasaCodes || []),
        fyloCodes: JSON.stringify(s.fyloCodes || []),
        profileWeights: JSON.stringify(profileWeights || {})
      });
    });

    logInfo('Catalog saved', {
      seriesCount: Object.keys(series).length
    });

    return { success: true };
  } catch (error) {
    logError('Failed to save catalog', error);
    throw error;
  }
}

/**
 * Merge catalog data from AI analysis
 * @param {object} aiData - Data from AI analysis
 * @return {object} Merge result
 */
function mergeCatalogFromAI(aiData) {
  try {
    validateRequired({ aiData }, ['aiData']);

    const catalog = loadCatalogData();
    let seriesAdded = 0;
    let codesAdded = 0;

    // Add series
    if (aiData.series && Array.isArray(aiData.series)) {
      aiData.series.forEach(s => {
        if (!catalog.series[s.name]) {
          catalog.series[s.name] = {
            pricePerKg: 0,
            laborPerUnit: 0,
            kasaCodes: [],
            fyloCodes: []
          };
          seriesAdded++;
        }
      });
    }

    // Add frame codes
    if (aiData.frames && Array.isArray(aiData.frames)) {
      aiData.frames.forEach(f => {
        const series = catalog.series[f.series];
        if (series && !series.kasaCodes.includes(f.code)) {
          series.kasaCodes.push(f.code);
          codesAdded++;
        }
      });
    }

    // Add sash codes
    if (aiData.sashes && Array.isArray(aiData.sashes)) {
      aiData.sashes.forEach(s => {
        const series = catalog.series[s.series];
        if (series && !series.fyloCodes.includes(s.code)) {
          series.fyloCodes.push(s.code);
          codesAdded++;
        }
      });
    }

    // Update pricing
    if (aiData.pricing && Array.isArray(aiData.pricing)) {
      aiData.pricing.forEach(p => {
        const series = catalog.series[p.series];
        if (series) {
          if (p.type === 'labor_per_unit') {
            series.laborPerUnit = p.value;
          } else if (p.type === 'price_per_kg') {
            series.pricePerKg = p.value;
          }
        }
      });
    }

    saveCatalogData(catalog);

    const result = {
      success: true,
      seriesAdded,
      codesAdded,
      totalSeries: Object.keys(catalog.series).length
    };

    logInfo('Catalog merged from AI data', result);
    return result;
  } catch (error) {
    logError('Failed to merge catalog from AI', error);
    throw error;
  }
}

/**
 * Get series by name
 * @param {string} seriesName - Series name
 * @return {object} Series data
 */
function getSeries(seriesName) {
  try {
    validateRequired({ seriesName }, ['seriesName']);

    const catalog = loadCatalogData();
    const series = catalog.series[seriesName];

    if (!series) {
      throw new NotFoundError('Series', seriesName);
    }

    return series;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logError('Failed to get series', error);
    throw error;
  }
}

/**
 * Add new series
 * @param {object} seriesData - Series data
 * @return {object} Add result
 */
function addSeries(seriesData) {
  try {
    validateRequired(seriesData, ['name']);

    const catalog = loadCatalogData();

    if (catalog.series[seriesData.name]) {
      throw new ValidationError(`Series already exists: ${seriesData.name}`);
    }

    catalog.series[seriesData.name] = {
      pricePerKg: seriesData.pricePerKg || 0,
      laborPerUnit: seriesData.laborPerUnit || 0,
      kasaCodes: seriesData.kasaCodes || [],
      fyloCodes: seriesData.fyloCodes || []
    };

    saveCatalogData(catalog);

    logInfo('Series added', { name: seriesData.name });
    return { success: true, name: seriesData.name };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logError('Failed to add series', error);
    throw error;
  }
}

/**
 * Update series
 * @param {string} seriesName - Series name
 * @param {object} updates - Update data
 * @return {object} Update result
 */
function updateSeries(seriesName, updates) {
  try {
    validateRequired({ seriesName }, ['seriesName']);

    const catalog = loadCatalogData();
    const series = catalog.series[seriesName];

    if (!series) {
      throw new NotFoundError('Series', seriesName);
    }

    if (updates.pricePerKg !== undefined) series.pricePerKg = updates.pricePerKg;
    if (updates.laborPerUnit !== undefined) series.laborPerUnit = updates.laborPerUnit;
    if (updates.kasaCodes !== undefined) series.kasaCodes = updates.kasaCodes;
    if (updates.fyloCodes !== undefined) series.fyloCodes = updates.fyloCodes;

    saveCatalogData(catalog);

    logInfo('Series updated', { name: seriesName });
    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logError('Failed to update series', error);
    throw error;
  }
}

/**
 * Delete series
 * @param {string} seriesName - Series name
 * @return {object} Delete result
 */
function deleteSeries(seriesName) {
  try {
    validateRequired({ seriesName }, ['seriesName']);

    const catalog = loadCatalogData();

    if (!catalog.series[seriesName]) {
      throw new NotFoundError('Series', seriesName);
    }

    delete catalog.series[seriesName];
    saveCatalogData(catalog);

    logInfo('Series deleted', { name: seriesName });
    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logError('Failed to delete series', error);
    throw error;
  }
}

/**
 * Get all series names
 * @return {array} Series names
 */
function getAllSeriesNames() {
  try {
    const catalog = loadCatalogData();
    return Object.keys(catalog.series).sort();
  } catch (error) {
    logError('Failed to get series names', error);
    throw error;
  }
}

/**
 * Search catalog
 * @param {string} query - Search query
 * @return {array} Matching items
 */
function searchCatalog(query) {
  try {
    if (!query || !query.trim()) {
      throw new ValidationError('Search query cannot be empty');
    }

    const catalog = loadCatalogData();
    const lowerQuery = query.toLowerCase();
    const results = [];

    Object.keys(catalog.series).forEach(seriesName => {
      if (seriesName.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'series',
          name: seriesName,
          data: catalog.series[seriesName]
        });
      }
    });

    logDebug('Catalog search', { query, resultsCount: results.length });
    return results;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logError('Catalog search failed', error);
    throw error;
  }
}
