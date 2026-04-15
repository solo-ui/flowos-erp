// ══════════════════════════════════════════════════════════════════════════════
// ANTHROPIC API SERVICE MODULE
// Integration with Claude API for AI features
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Call Claude API with messages
 * @param {array} messages - Message array
 * @param {object} options - Optional parameters
 * @return {object} API response
 */
function callClaudeAPI(messages, options = {}) {
  try {
    const apiKey = getAnthropicKey();
    const config = getConfig('API');

    const payload = {
      model: options.model || config.MODEL,
      max_tokens: options.maxTokens || config.MAX_TOKENS,
      messages: messages,
      ...options.extra
    };

    logDebug('Calling Claude API', {
      model: payload.model,
      messageCount: messages.length,
      maxTokens: payload.max_tokens
    });

    const response = UrlFetchApp.fetch(config.ANTHROPIC_BASE_URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': config.ANTHROPIC_VERSION
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: config.TIMEOUT
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      throw new APIError('Claude', result.error.message, result.error);
    }

    logInfo('Claude API call successful', {
      model: payload.model,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens
    });

    return result;
  } catch (error) {
    if (error instanceof APIError) throw error;
    logError('Claude API call failed', error);
    throw new APIError('Claude', error.message);
  }
}

/**
 * Analyze images with Claude Vision
 * @param {array} base64Images - Base64 encoded images
 * @param {string} prompt - Analysis prompt
 * @param {object} options - Optional parameters
 * @return {object} Analysis result
 */
function analyzeImagesWithVision(base64Images, prompt, options = {}) {
  try {
    if (!Array.isArray(base64Images) || base64Images.length === 0) {
      throw new ValidationError('No images provided');
    }

    if (base64Images.length > 10) {
      throw new ValidationError('Maximum 10 images allowed per request');
    }

    // Build image content blocks
    const imageContent = base64Images.map((base64, index) => {
      if (!base64 || typeof base64 !== 'string') {
        throw new ValidationError(`Invalid image at index ${index}`);
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64
        }
      };
    });

    const messages = [{
      role: 'user',
      content: [
        ...imageContent,
        {
          type: 'text',
          text: prompt
        }
      ]
    }];

    logInfo('Analyzing images with vision', {
      imageCount: base64Images.length,
      promptLength: prompt.length
    });

    const result = callClaudeAPI(messages, {
      model: 'claude-opus-4-6',
      maxTokens: 4096,
      ...options
    });

    return {
      success: true,
      text: result.content[0]?.text || '',
      usage: result.usage,
      model: result.model
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) throw error;
    logError('Image analysis failed', error);
    throw new AppError('Image analysis failed: ' + error.message);
  }
}

/**
 * Extract JSON from text
 * @param {string} text - Text containing JSON
 * @return {object} Parsed JSON
 */
function extractJSON(text) {
  try {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ValidationError('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logError('JSON extraction failed', error);
    throw new ValidationError('Could not parse JSON response');
  }
}

/**
 * Analyze aluminum catalog images
 * @param {array} base64Images - Catalog images
 * @return {object} Catalog data
 */
function analyzeAluminumCatalog(base64Images) {
  try {
    const prompt = `Analyze these aluminum window/door catalog images and extract ALL product data in JSON format. Extract and organize:
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
    Be thorough and extract ALL visible information. Return ONLY valid JSON.`;

    const result = analyzeImagesWithVision(base64Images, prompt);
    const data = extractJSON(result.text);

    return {
      success: true,
      data: data,
      imageCount: base64Images.length,
      model: result.model
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) throw error;
    logError('Catalog analysis failed', error);
    throw error;
  }
}

/**
 * Generate text completion
 * @param {string} prompt - Prompt text
 * @param {object} options - Optional parameters
 * @return {string} Generated text
 */
function generateText(prompt, options = {}) {
  try {
    validateRequired({ prompt }, ['prompt']);

    const messages = [{
      role: 'user',
      content: prompt
    }];

    const result = callClaudeAPI(messages, {
      maxTokens: options.maxTokens || 1000,
      ...options
    });

    return result.content[0]?.text || '';
  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) throw error;
    logError('Text generation failed', error);
    throw error;
  }
}

/**
 * Batch analyze multiple texts
 * @param {array} texts - Texts to analyze
 * @param {string} prompt - Analysis prompt
 * @return {array} Analysis results
 */
function batchAnalyzeTexts(texts, prompt) {
  try {
    validateRequired({ texts, prompt }, ['texts', 'prompt']);

    if (!Array.isArray(texts)) {
      throw new ValidationError('Texts must be an array');
    }

    const results = [];
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = generateText(`${prompt}\n\nText: ${texts[i]}`);
        results.push({ success: true, text: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    logInfo('Batch analysis completed', {
      total: texts.length,
      successful: results.filter(r => r.success).length
    });

    return results;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logError('Batch analysis failed', error);
    throw error;
  }
}
