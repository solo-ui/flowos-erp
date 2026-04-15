# FlowOS v3 - Aluminum ERP System

A professional, modular aluminum window/door ERP system built with Google Apps Script (backend) and React (frontend), featuring AI-powered catalog analysis and comprehensive project management.

## Features

### 🏭 Core Features
- **Client Management** - Track customers with detailed profiles
- **Project Management** - Complete project lifecycle management with measurements, analysis, and quotations
- **Supplier Management** - Manage aluminum suppliers and their information
- **Order Management** - Create and track standalone supplier orders
- **Aluminum Catalog** - Comprehensive product catalog with series, profiles, and pricing
- **Settings** - Configurable application settings and company information

### 🤖 AI Features
- **AI Image Scanner** - Analyze aluminum catalog images with Claude Vision
- **Batch Image Processing** - Process up to 10 images in a single request
- **Automatic Data Extraction** - Extract product data from images
- **Catalog Merging** - Automatically merge AI-extracted data into catalog

### 📊 Advanced Features
- **Payment Planning** - Track multi-stage payment plans
- **Invoice Management** - Generate and manage invoices
- **Window/Door Specifications** - Detailed window configuration tracking
- **Email & Viber Integration** - Send quotes and documents via email or Viber
- **PDF Export** - Export projects and invoices as PDF
- **Database Administration** - Backup, restore, and manage database

### 🔧 Technical Features
- **Modular Architecture** - Organized into independent modules
- **Error Handling** - Comprehensive error handling and validation
- **Logging System** - Multi-level logging with export capability
- **Type Safety** - Input validation and error checking throughout
- **API Documentation** - Complete REST API documentation
- **Responsive UI** - Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Google Account
- Anthropic API key (for AI features)
- Modern web browser

### Installation

1. **Clone or download this repository**

2. **Open Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Create a new project

3. **Copy backend code**
   - Copy all `.gs` files from `backend/src/` into Google Apps Script
   - Copy `frontend/src/index.html` as HTML file named `index`

4. **Configure**
   - Set `SHEET_ID` in `config.gs`
   - Add Script Properties:
     - `ANTHROPIC_API_KEY` - Your Claude API key
     - `GOOGLE_SHEET_ID` - Your Sheet ID

5. **Deploy**
   - Click Deploy → New Deployment
   - Type: Web app
   - Execute as: Your Account
   - Share with: Anyone
   - Copy the deployment URL

6. **Initialize**
   - Open the deployment URL
   - Application initializes automatically on first load

### First Steps

1. **Configure Company Information**
   - Go to Settings tab
   - Add your company details (name, phone, email, etc.)

2. **Set Up Suppliers**
   - Add your aluminum suppliers
   - Configure contact information

3. **Create Catalog**
   - Add aluminum series manually, OR
   - Use AI Scanner to extract from catalog images

4. **Add Clients**
   - Start creating client records

5. **Create Projects**
   - Create new projects linked to clients
   - Add window specifications
   - Generate quotations

## Project Structure

```
flowos-app/
├── backend/                    # Google Apps Script Backend
│   ├── src/
│   │   ├── main.gs            # Entry point
│   │   ├── config.gs          # Configuration
│   │   ├── db/                # Database layer
│   │   ├── api/               # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   └── .env.example
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── index.html         # Main HTML
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utilities
│   │   └── styles/            # CSS
│   └── .env.example
├── docs/                      # Documentation
│   ├── API.md                # API Reference
│   ├── ARCHITECTURE.md        # Architecture Guide
│   └── DEPLOYMENT.md          # Deployment Guide
├── README.md                  # This file
└── package.json              # Project metadata
```

## Architecture

### Backend (Google Apps Script)

**Modular structure with clear separation of concerns:**

- **config.gs** - Configuration management
- **db/schema.gs** - Database schema definitions
- **db/database.gs** - CRUD operations
- **api/routes.gs** - HTTP endpoint handlers
- **services/anthropic.gs** - Claude API integration
- **services/catalog.gs** - Catalog management
- **utils/logger.gs** - Logging system
- **utils/errors.gs** - Error handling

### Frontend (React)

**Component-based architecture:**

- **App** - Main application container
- **Sidebar** - Navigation
- **Dashboard** - Overview and quick access
- **Workspace** - Project detail view with tabs
- **Dialogs** - Modal dialogs for forms
- **Common** - Reusable components

## API Reference

### REST Endpoints

All requests use POST method to the deployment URL.

#### Database CRUD
```javascript
// Create
{ "action": "CREATE", "table": "Clients", "data": {...} }

// Read
{ "action": "READ", "table": "Clients", "id": "c123" }

// Update
{ "action": "UPDATE", "table": "Clients", "id": "c123", "data": {...} }

// Delete
{ "action": "DELETE", "table": "Clients", "id": "c123" }

// List all
{ "action": "LIST", "table": "Clients" }
```

#### AI Operations
```javascript
// Analyze catalog images
{ "action": "analyzeCatalogImages", "images": [...] }

// Generate text
{ "action": "generateText", "data": { "prompt": "..." } }
```

#### Data Operations
```javascript
// Load full database
{ "action": "loadData" }

// Save full database
{ "action": "saveData", "data": {...} }
```

See [docs/API.md](docs/API.md) for complete API documentation.

## Configuration

### Environment Variables

Set in Google Apps Script Project Settings:

```
ANTHROPIC_API_KEY=sk-ant-...     # Claude API key
GOOGLE_SHEET_ID=your-id-here     # Google Sheets ID
LOG_LEVEL=INFO                    # DEBUG|INFO|WARN|ERROR
```

### Configuration File

Edit `backend/src/config.gs` to customize:

```javascript
const CONFIG = {
  SHEET_ID: '...',
  API: { /* API configuration */ },
  APP: { /* App configuration */ },
  STORAGE: { /* Storage configuration */ },
  FEATURES: { /* Feature flags */ },
  LOGGING: { /* Logging configuration */ }
};
```

## Usage Examples

### Create a Client

```javascript
const client = {
  id: 'c001',
  name: 'Νίκος Παπαδόπουλος',
  phone: '6941234567',
  email: 'nikos@mail.gr',
  city: 'Αθήνα',
  category: 'Ιδιώτης',
  source: 'Σύσταση'
};

fetch(DEPLOYMENT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'CREATE',
    table: 'Clients',
    data: client
  })
}).then(r => r.json()).then(console.log);
```

### Analyze Catalog Images

```javascript
const images = [
  'base64-image-1',
  'base64-image-2'
];

fetch(DEPLOYMENT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'analyzeCatalogImages',
    images: images
  })
}).then(r => r.json()).then(result => {
  console.log('Extracted data:', result.data);
});
```

### Load Full Database

```javascript
fetch(DEPLOYMENT_URL, {
  method: 'POST',
  body: JSON.stringify({ action: 'loadData' })
}).then(r => r.json()).then(data => {
  console.log('Clients:', data.data.clients);
  console.log('Projects:', data.data.projects);
  console.log('Catalog:', data.data.catalog);
});
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. Create Google Apps Script project
2. Copy all backend files
3. Copy frontend HTML
4. Set Script Properties
5. Deploy as Web app

## Troubleshooting

### "SHEET_ID not configured"
- Set `GOOGLE_SHEET_ID` in Script Properties
- Restart the application

### "ANTHROPIC_API_KEY not set"
- Get API key from [console.anthropic.com](https://console.anthropic.com)
- Add to Script Properties as `ANTHROPIC_API_KEY`

### "google is not defined"
- Application must run in Google Apps Script environment
- Not compatible with localhost development

### Database empty
- Run initialization: `{ "action": "initializeDatabase" }`
- Check that Sheet ID is correct

## Development

### Local Development

For development testing without Google Apps Script:

```bash
# Start local HTTP server
python -m http.server 8000

# Or with Node.js
npx http-server
```

**Note**: AI features and database operations require Google Apps Script deployment.

### Testing

Debug functions available in `main.gs`:

```javascript
// Check logs
debugShowLogs()

// Clear database
debugClearDatabase()

// Reset to defaults
debugResetToDefaults()

// Test configuration
testConfiguration()
```

## Performance

- Supports up to 100,000 records per table
- 20 API requests per second (Google Apps Script limit)
- 6 minutes/hour execution time (Google Apps Script limit)
- Optimized with debounced saves (5 seconds)

## Security

- API keys stored in Script Properties (not in code)
- Input validation on all operations
- Error handling without exposing sensitive data
- CORS enabled for web app
- Google Sheets share restrictions apply

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (responsive design)

## Contributing

This is a professional ERP system. For improvements:

1. Maintain modular architecture
2. Add comprehensive error handling
3. Update documentation
4. Test thoroughly before deploying

## License

This project is proprietary software for aluminum ERP management.

## Support

For issues or questions:

1. Check [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment help
2. Review [docs/API.md](docs/API.md) for API documentation
3. Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture details
4. View application logs in Google Apps Script console

## Changelog

### v3.0.0 (Current)
- Complete refactor with modular architecture
- Professional error handling and logging
- API documentation
- Architecture documentation
- Deployment guide

### v2.0.0
- React frontend with workspace management
- Google Apps Script backend
- AI catalog scanning

### v1.0.0
- Initial release

---

**Built with ❤️ for professional aluminum ERP management**
