# FlowOS v3 Deployment Guide

## Deployment Steps

### 1. Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a new project named "FlowOS v3"
3. Note the Script ID for later

### 2. Set Up Google Sheet

1. Create a new Google Sheet
2. Name it "FlowOS Database"
3. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/`
4. Note this ID

### 3. Update Configuration

In `backend/src/config.gs`, update:
```javascript
const SHEET_ID = '{YOUR_SHEET_ID}';
```

### 4. Copy Backend Code

Copy all files from `backend/src/` into Google Apps Script:

1. In Google Apps Script editor, create new files for each `.gs` file:
   - `config.gs`
   - `main.gs`
   - `db/schema.gs`
   - `db/database.gs`
   - `api/routes.gs`
   - `services/anthropic.gs`
   - `services/catalog.gs`
   - `utils/logger.gs`
   - `utils/errors.gs`

2. Copy content from each file into the corresponding Script file

3. Maintain the order (config first, then dependencies, then main)

### 5. Add Frontend HTML

1. In Google Apps Script, create a new HTML file named `index`
2. Copy the content from `frontend/src/index.html` into this file

### 6. Configure Script Properties

1. In Google Apps Script, go to **Project Settings** ⚙️
2. Find **Script Properties**
3. Add the following properties:

| Property | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Claude API key) |
| `GOOGLE_SHEET_ID` | Your Sheet ID |
| `LOG_LEVEL` | `INFO` |

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### 7. Set Execution Permissions

1. Click the **Run** button to authorize the script
2. Google will ask for permissions, click **Allow**
3. Grant permissions for:
   - Google Sheets access
   - Google Drive access
   - Email (for notifications)

### 8. Create Deployment

1. Click **Deploy** button
2. Select **New Deployment**
3. Choose **Type: Web app**
4. Set **Execute as:** Your Google Account
5. Set **Who has access:** Anyone
6. Click **Deploy**
7. Copy the deployment URL
8. Note the Deployment ID

### 9. Test Deployment

Open the deployment URL in your browser. You should see the FlowOS application.

### 10. Initialize Database

Run in browser console:
```javascript
fetch('YOUR_DEPLOYMENT_URL', {
  method: 'POST',
  body: JSON.stringify({ action: 'initializeDatabase' })
}).then(r => r.json()).then(console.log);
```

## Updating Deployment

To update the deployed code:

1. Make changes to `.gs` files in Google Apps Script
2. Click **Deploy** → **Manage deployments**
3. Click the edit icon on the latest deployment
4. Click **Create new version**
5. Click **Deploy**

## Environment Variables

### Script Properties

Set these in Google Apps Script Project Settings:

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_SHEET_ID=your-sheet-id
LOG_LEVEL=INFO
```

### Frontend Configuration

In `frontend/src/utils/api.js`, configure:

```javascript
const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  batchSize: 100
};
```

## Database Setup

### Initial Tables

The following tables are created automatically:

- **Clients** - Customer/client information
- **Projects** - Project records
- **Suppliers** - Supplier information
- **StandaloneOrders** - Standalone orders
- **Catalog** - Aluminum product catalog
- **Settings** - Application settings

### Initial Data

Sample data is seeded automatically:
- 1 client (Νίκος Παπαδόπουλος)
- 3 suppliers (Alumil, Glasscorp, Rollotech)
- 4 catalog series (EOS60, ESS34, ESS47, S77)

## Troubleshooting

### "SHEET_ID not configured"

- Check that `GOOGLE_SHEET_ID` is set in Script Properties
- Verify the Sheet ID is correct
- Restart the application

### "ANTHROPIC_API_KEY not set"

- Go to [console.anthropic.com](https://console.anthropic.com) to create an API key
- Add `ANTHROPIC_API_KEY` to Script Properties
- The key must start with `sk-ant-`

### "Authorization needed"

- Click **Run** in Google Apps Script
- Grant all permissions requested
- Try accessing the application again

### Database empty after deployment

- Run the initialization:
  ```javascript
  fetch('YOUR_DEPLOYMENT_URL', {
    method: 'POST',
    body: JSON.stringify({ action: 'initializeDatabase' })
  }).then(r => r.json()).then(console.log);
  ```

### AI Scanner not working

- Verify `ANTHROPIC_API_KEY` is correct
- Check that the API key has access to Claude Opus model
- View logs for detailed error messages

## Performance Optimization

### Reduce Google Sheets Queries

The application uses debounced saves (5 seconds) to reduce database hits:

```javascript
// Configured in components
const SAVE_DEBOUNCE_MS = 5000;
```

### Enable Caching

For frequently accessed data:

```javascript
// Frontend caches catalog data
const cacheCatalog = (data) => {
  localStorage.setItem('catalog', JSON.stringify(data));
};
```

### Monitor Quotas

Google Apps Script has quotas:
- 6 minutes/hour execution time
- 20 read/write operations/second
- 50MB Drive storage/day

Monitor usage in **Executions** tab.

## Backup & Recovery

### Backup Google Sheet

1. Open the Google Sheet
2. File → **Download** → **Microsoft Excel**
3. Save to safe location

### Restore Backup

1. Create new Google Sheet
2. Open backup Excel file
3. Copy data into new sheet
4. Update `GOOGLE_SHEET_ID` in Script Properties
5. Deploy new version

## Logging

### View Logs

In Google Apps Script:
1. Click **Executions** tab
2. Find your execution
3. Click to view logs

### Export Logs

From application:
```javascript
fetch('YOUR_DEPLOYMENT_URL', {
  method: 'POST',
  body: JSON.stringify({ action: 'exportLogs' })
}).then(r => r.json()).then(data => {
  window.open(data);
});
```

## Security Best Practices

1. **API Keys**: Never commit API keys to version control
2. **Sheet Sharing**: Only share the sheet with authorized users
3. **Deployment**: Use "Anyone" for web app access (protected by deployment URL)
4. **Logging**: Review logs regularly for suspicious activity
5. **Backups**: Keep regular backups of critical data

## Scaling Considerations

The current architecture supports:
- Up to 100,000 records per table
- Multiple simultaneous users
- Up to 10 images per AI analysis request
- 20 API requests per second

For larger deployments, consider:
1. Archiving old data to separate sheets
2. Implementing caching layer
3. Using Cloud Firestore for real-time sync
4. Migrating to BigQuery for analytics

## Support & Debugging

### Debug Mode

Enable debug logging:
```javascript
// In config.gs
LOG_LEVEL: 'DEBUG'
```

### Check Health

```javascript
fetch('YOUR_DEPLOYMENT_URL', {
  method: 'POST',
  body: JSON.stringify({ action: 'healthCheck' })
}).then(r => r.json()).then(console.log);
```

### Test Configuration

```javascript
fetch('YOUR_DEPLOYMENT_URL', {
  method: 'POST',
  body: JSON.stringify({ action: 'testConfiguration' })
}).then(r => r.json()).then(console.log);
```
