# FlowOS v3 API Documentation

## Overview

FlowOS v3 provides a RESTful API backed by Google Apps Script with full CRUD operations, AI integration, and catalog management.

## Base URL

```
https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
```

## Authentication

The API uses Google Apps Script's built-in authentication. All requests are authenticated through the deployment URL.

## Request/Response Format

### Request

```json
{
  "action": "CREATE|READ|UPDATE|DELETE|LIST",
  "table": "Clients|Projects|Suppliers|StandaloneOrders|Catalog|Settings",
  "data": {},
  "id": "record-id"
}
```

### Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}
```

## Error Response

```json
{
  "error": true,
  "message": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-04-15T10:30:00Z"
}
```

## Endpoints

### Database Operations

#### CREATE - Insert new record

```
POST /
{
  "action": "CREATE",
  "table": "Clients",
  "data": {
    "id": "c123",
    "name": "Νίκος Παπαδόπουλος",
    "phone": "6941234567",
    "email": "nikos@mail.gr",
    "city": "Αθήνα",
    "category": "Ιδιώτης",
    "source": "Σύσταση"
  }
}
```

#### READ - Get single record

```
POST /
{
  "action": "READ",
  "table": "Clients",
  "id": "c123"
}
```

#### UPDATE - Modify existing record

```
POST /
{
  "action": "UPDATE",
  "table": "Clients",
  "id": "c123",
  "data": {
    "phone": "6949999999"
  }
}
```

#### DELETE - Remove record

```
POST /
{
  "action": "DELETE",
  "table": "Clients",
  "id": "c123"
}
```

#### LIST - Get all records

```
POST /
{
  "action": "LIST",
  "table": "Clients"
}
```

### Data Operations

#### Load Full Database

```
POST /
{
  "action": "loadData"
}
```

Response includes all tables:
```json
{
  "success": true,
  "data": {
    "clients": [...],
    "projects": [...],
    "suppliers": [...],
    "settings": {...},
    "catalog": {...},
    "standaloneOrders": [...]
  }
}
```

#### Save Full Database

```
POST /
{
  "action": "saveData",
  "data": {
    "clients": [...],
    "projects": [...],
    "suppliers": [...],
    "settings": {...},
    "catalog": {...},
    "standaloneOrders": [...]
  }
}
```

### Catalog Operations

#### Get Catalog

```
POST /
{
  "action": "getCatalog"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "series": {
      "EOS60": {
        "pricePerKg": 3.20,
        "laborPerUnit": 45,
        "kasaCodes": ["EOS60-K60", "EOS60-K65"],
        "fyloCodes": ["EOS60-F60", "EOS60-F65"]
      }
    },
    "profileWeights": {...}
  }
}
```

#### Analyze Catalog Images

```
POST /
{
  "action": "analyzeCatalogImages",
  "images": ["base64_image_1", "base64_image_2"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "series": [...],
    "frames": [...],
    "sashes": [...],
    "pricing": [...]
  },
  "imageCount": 2,
  "model": "claude-opus-4-6"
}
```

#### Merge Catalog Data

```
POST /
{
  "action": "mergeCatalog",
  "data": {
    "series": [...],
    "frames": [...],
    "sashes": [...],
    "pricing": [...]
  }
}
```

### AI Operations

#### Generate Text

```
POST /
{
  "action": "generateText",
  "data": {
    "prompt": "Describe aluminum window profiles",
    "maxTokens": 1000
  }
}
```

### System Operations

#### Initialize Database

```
POST /
{
  "action": "initializeDatabase"
}
```

#### Get Logs

```
POST /
{
  "action": "getLogs"
}
```

#### Get Statistics

```
POST /
{
  "action": "getStats"
}
```

Response:
```json
{
  "success": true,
  "stats": {
    "clients": 15,
    "projects": 8,
    "suppliers": 5,
    "orders": 23,
    "logs": {...}
  }
}
```

## Table Schemas

### Clients
- `id` (string) - Unique identifier
- `name` (string) - Client name
- `phone` (string) - Phone number
- `email` (string) - Email address
- `city` (string) - City
- `category` (string) - Client category
- `source` (string) - Source of client

### Projects
- `id` (string) - Project ID
- `clientId` (string) - Associated client ID
- `code` (string) - Project code
- `title` (string) - Project title
- `address` (string) - Project address
- `date` (string) - Project date
- `status` (string) - Project status
- `markup` (number) - Markup percentage
- `windows` (object) - Window specifications
- `payments` (object) - Payment plan
- `extras` (object) - Extra items
- `invoices` (array) - Invoices
- `notes` (string) - Notes
- `agreement` (object) - Agreement data
- `payPlan` (object) - Payment plan details
- `kmWins` (string) - Window type
- `orders` (array) - Associated orders

### Suppliers
- `id` (string) - Supplier ID
- `name` (string) - Supplier name
- `contact` (string) - Contact person
- `phone` (string) - Phone number
- `email` (string) - Email address
- `viber` (string) - Viber number
- `type` (string) - Supplier type
- `notes` (string) - Notes

### Catalog
- `series` (string) - Series name
- `pricePerKg` (number) - Price per kilogram
- `laborPerUnit` (number) - Labor cost per unit
- `kasaCodes` (array) - Frame codes
- `fyloCodes` (array) - Sash codes
- `profileWeights` (object) - Weight specifications

### Settings
- `key` (string) - Setting key
- `value` (string|number|object) - Setting value

### StandaloneOrders
- `id` (string) - Order ID
- `code` (string) - Order code
- `type` (string) - Order type
- `supplierId` (string) - Supplier ID
- `date` (string) - Order date
- `status` (string) - Order status
- `sentVia` (string) - Sent via (email, viber, etc)
- `rows` (array) - Order items
- `standalone` (boolean) - Is standalone order

## Error Codes

- `VALIDATION_ERROR` - Validation failed (400)
- `NOT_FOUND` - Resource not found (404)
- `AUTH_ERROR` - Authentication failed (401)
- `API_ERROR` - External API error (503)
- `UNKNOWN_ACTION` - Unknown action (400)
- `INTERNAL_ERROR` - Internal server error (500)

## Rate Limiting

No explicit rate limiting. Respect Google Apps Script quotas:
- 20 read/write operations per second
- 6 minutes/hour of execution time

## Pagination

Use LIST action for paginated results. For large datasets, consider filtering in the frontend.

## CORS

CORS is enabled via `XFrameOptionsMode.ALLOWALL` in the HTML output.
