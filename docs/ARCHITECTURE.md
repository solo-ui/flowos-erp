# FlowOS v3 Architecture

## Overview

FlowOS v3 is a professional aluminum ERP system with a modular architecture separating concerns into distinct modules with clear responsibilities.

## Directory Structure

```
flowos-app/
├── backend/                          # Google Apps Script Backend
│   ├── src/
│   │   ├── main.gs                   # Entry point & public API
│   │   ├── config.gs                 # Configuration management
│   │   ├── db/
│   │   │   ├── schema.gs             # Database schema definitions
│   │   │   └── database.gs           # CRUD operations
│   │   ├── api/
│   │   │   └── routes.gs             # HTTP route handlers
│   │   ├── services/
│   │   │   ├── anthropic.gs          # Claude API integration
│   │   │   └── catalog.gs            # Catalog management
│   │   └── utils/
│   │       ├── logger.gs             # Logging utilities
│   │       └── errors.gs             # Error handling
│   └── .env.example                  # Configuration template
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── index.html                # Main HTML file
│   │   ├── components/               # React components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── utils/                    # Utility functions
│   │   └── styles/                   # CSS styles
│   └── .env.example                  # Frontend config
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── ARCHITECTURE.md               # This file
│   └── DEPLOYMENT.md                 # Deployment guide
├── package.json                      # Project metadata
├── README.md                         # Main README
└── .gitignore                        # Git ignore rules
```

## Module Responsibilities

### Backend Modules

#### `config.gs` - Configuration Management
- Centralized configuration constants
- Configuration validation
- API key management
- Environment variable handling

**Key Functions:**
- `getConfig(path, defaultValue)` - Access config values
- `getAnthropicKey()` - Get Anthropic API key
- `validateConfig()` - Validate configuration

#### `db/schema.gs` - Database Schema
- Table schema definitions
- Field validation rules
- Default record templates
- Schema validation

**Key Data Structures:**
- `SCHEMA` - Complete schema definitions
- `TABLE_HEADERS` - Column headers for each table

**Key Functions:**
- `getTableSchema(tableName)` - Get schema for table
- `validateRecord(tableName, record)` - Validate record

#### `db/database.gs` - Database Operations
- CRUD operations
- Sheet management
- Data serialization/deserialization
- Database initialization

**Key Functions:**
- `loadTable(tableName)` - Read all records
- `createRecord(tableName, record)` - Create new record
- `updateRecord(tableName, id, updates)` - Update record
- `deleteRecord(tableName, id)` - Delete record
- `initializeDatabase()` - Initialize all tables

#### `utils/logger.gs` - Logging System
- Multi-level logging (DEBUG, INFO, WARN, ERROR)
- Log buffering and export
- Log statistics
- Performance tracking

**Key Functions:**
- `logDebug(message, data)` - Log debug message
- `logInfo(message, data)` - Log info message
- `logWarn(message, data)` - Log warning
- `logError(message, error)` - Log error
- `getLogs()` - Get all logs
- `exportLogs()` - Export logs to file

#### `utils/errors.gs` - Error Handling
- Custom error classes
- Error response formatting
- Input validation utilities
- Error wrapping

**Key Classes:**
- `AppError` - Base application error
- `ValidationError` - Validation failures
- `NotFoundError` - Resource not found
- `APIError` - External API errors

**Key Functions:**
- `createErrorResponse(error)` - Format error response
- `validateRequired(data, fields)` - Check required fields
- `validateEmail(email)` - Validate email format
- `validatePhone(phone)` - Validate phone format

#### `services/anthropic.gs` - AI Integration
- Claude API integration
- Image analysis with vision
- Text generation
- Batch processing

**Key Functions:**
- `callClaudeAPI(messages, options)` - Call Claude API
- `analyzeImagesWithVision(images, prompt)` - Analyze images
- `analyzeAluminumCatalog(images)` - Analyze catalog images
- `generateText(prompt, options)` - Generate text

#### `services/catalog.gs` - Catalog Management
- Catalog data operations
- AI catalog merging
- Series management
- Catalog search

**Key Functions:**
- `loadCatalogData()` - Load catalog
- `saveCatalogData(catalog)` - Save catalog
- `mergeCatalogFromAI(aiData)` - Merge AI-extracted data
- `getSeries(seriesName)` - Get series details
- `searchCatalog(query)` - Search catalog

#### `api/routes.gs` - API Routes
- HTTP request routing
- Request validation
- Response formatting
- Legacy API compatibility

**Key Functions:**
- `doGet(e)` - Handle GET requests
- `doPost(e)` - Handle POST requests
- `routeRequest(body)` - Route to appropriate handler
- `handleCreate/Read/Update/Delete()` - CRUD handlers

### Frontend Modules

#### `index.html` - Main Application
- React application entry point
- Component definitions
- Styling
- React initialization

**Key Components:**
- `App` - Main application container
- `Sidebar` - Navigation sidebar
- `Dashboard` - Dashboard view
- `Workspace` - Project workspace
- `AIScanner` - AI image analysis

#### Custom Hooks
- `useDatabase()` - Database operations hook
- `useAPI()` - API call hook
- `useLocalStorage()` - Local storage hook

#### Utilities
- `api.js` - API client wrapper
- `constants.js` - UI constants (colors, etc)
- `helpers.js` - Common helper functions

## Data Flow

### Create Operation Flow

```
User Input
  ↓
React Component (setState)
  ↓
useDatabase Hook (save debouncer)
  ↓
API Call (google.script.run)
  ↓
routes.gs (handleCreate)
  ↓
database.gs (createRecord)
  ↓
schema.gs (validateRecord)
  ↓
Google Sheets (append row)
  ↓
Response → React Component (refresh)
```

### AI Image Analysis Flow

```
User Selects Images
  ↓
AIScanner Component (base64 encoding)
  ↓
API Call (images array)
  ↓
routes.gs (handleAnalyzeCatalogImages)
  ↓
anthropic.gs (analyzeAluminumCatalog)
  ↓
Claude Vision API
  ↓
JSON Extraction
  ↓
catalog.gs (mergeCatalogFromAI)
  ↓
database.gs (saveCatalogData)
  ↓
Response → React Component (show results)
```

## Error Handling Strategy

### Layered Error Handling

1. **Validation Layer** - Input validation with `ValidationError`
2. **API Layer** - External API calls with `APIError`
3. **Database Layer** - Database operations with error logging
4. **Response Layer** - Error formatting and logging

### Error Response Format

All errors follow the `AppError` structure:
```json
{
  "error": true,
  "message": "Human-readable error",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-04-15T10:30:00Z"
}
```

## Logging Architecture

### Log Levels
- **DEBUG** - Detailed diagnostic information
- **INFO** - General informational messages
- **WARN** - Warning messages for potential issues
- **ERROR** - Error messages for failures

### Log Buffer
- In-memory log buffer (max 1,000 entries)
- Automatic log rotation
- Export to Google Drive capability
- Log statistics tracking

## Configuration Management

### Configuration Sources
1. `config.gs` - Default/hardcoded values
2. Script Properties - Runtime configuration
3. Environment variables - Deployment-specific

### Essential Configuration
- `SHEET_ID` - Google Sheets document ID
- `ANTHROPIC_API_KEY` - Claude API key
- `LOG_LEVEL` - Logging verbosity

## Security Considerations

1. **API Keys** - Stored in Script Properties, never hardcoded
2. **Input Validation** - All user input validated before processing
3. **Error Messages** - Generic error messages for users, detailed in logs
4. **Access Control** - Relies on Google Apps Script authentication
5. **Data Serialization** - JSON for data transport

## Performance Optimizations

1. **Debounced Saves** - Frontend debounces database saves
2. **Batch Operations** - Support for batch record operations
3. **Lazy Loading** - Components load data on demand
4. **Log Rotation** - Automatic log buffer management
5. **JSON Parsing** - Safe JSON parsing with fallback

## Scalability

Current architecture supports:
- Up to 100,000 records per table
- 20 API requests per second (Google Apps Script limit)
- Multiple concurrent users
- Large file uploads (50MB limit)

## Future Improvements

1. **Caching** - Add caching layer for frequently accessed data
2. **Indexing** - Add indexed lookups for large datasets
3. **Webhooks** - Add webhook support for external integrations
4. **Real-time** - Add real-time data synchronization
5. **Advanced Logging** - Add structured logging with Stackdriver
