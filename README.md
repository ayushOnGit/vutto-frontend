# Settlement Configuration Frontend

A React TypeScript frontend for managing settlement configurations for the challan processing system.

## Features

- ✅ **View Settlement Rules**: Display all settlement configurations in a clean table format
- ✅ **Create/Edit Rules**: Add new settlement rules or modify existing ones
- ✅ **Delete Rules**: Remove settlement rules with confirmation
- ✅ **Toggle Active Status**: Enable/disable rules without deleting them
- ✅ **Real-time Stats**: Dashboard showing total, active, and inactive rules
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Form Validation**: Client-side validation for all inputs
- ✅ **Error Handling**: Graceful error handling with user-friendly messages

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Lucide React** for icons

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (challan-backend)

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Backend API URL - Update this to match your backend server
REACT_APP_API_URL=https://test.fitstok.com
```

**Note**: Update the `REACT_APP_API_URL` to match your backend server URL and port.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm start
```

The application will open at `https://test.fitstok.com` (or the next available port).

### 5. Build for Production

```bash
npm run build
```

## Backend API Requirements

The frontend expects the following API endpoints to be available in your backend:

### Settlement Configuration Endpoints

```
GET    /api/settlement-configs           # Get all settlement configs
GET    /api/settlement-configs/:id       # Get config by ID
POST   /api/settlement-configs           # Create new config
PUT    /api/settlement-configs/:id       # Update config
DELETE /api/settlement-configs/:id       # Delete config
PATCH  /api/settlement-configs/:id/toggle # Toggle active status
```

### Example API Response Format

```json
{
  "id": 1,
  "rule_name": "DL_MPARIVAHAN_60",
  "source_type": "mparivahan",
  "region": "DL",
  "challan_year_cutoff": null,
  "amount_cutoff": null,
  "settlement_percentage": 60.00,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Adding Backend API Endpoints

Since you mentioned not to change the backend code, you'll need to add these API endpoints to your existing backend. Here's what you need to add:

### 1. Create API Routes (Example for Express.js)

Create a new file `challan-backend/api/routes/settlement-configs.js`:

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/settlement-configs
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.settlement_configs.findMany({
      orderBy: [
        { source_type: 'asc' },
        { region: 'asc' },
        { challan_year_cutoff: 'asc' }
      ]
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settlement configs' });
  }
});

// POST /api/settlement-configs
router.post('/', async (req, res) => {
  try {
    const config = await prisma.settlement_configs.create({
      data: req.body
    });
    res.status(201).json(config);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create settlement config' });
  }
});

// PUT /api/settlement-configs/:id
router.put('/:id', async (req, res) => {
  try {
    const config = await prisma.settlement_configs.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update settlement config' });
  }
});

// DELETE /api/settlement-configs/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.settlement_configs.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete settlement config' });
  }
});

// PATCH /api/settlement-configs/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  try {
    const config = await prisma.settlement_configs.update({
      where: { id: parseInt(req.params.id) },
      data: { is_active: req.body.is_active }
    });
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: 'Failed to toggle settlement config' });
  }
});

module.exports = router;
```

### 2. Register the Routes

Add this to your main routes file (`challan-backend/api/routes/index.js`):

```javascript
const settlementConfigsRoute = require('./settlement-configs');
router.use('/api/settlement-configs', settlementConfigsRoute);
```

## Usage Guide

### Creating a Settlement Rule

1. Click "Create New Rule" button
2. Fill in the form:
   - **Rule Name**: Unique identifier (e.g., "DL_MPARIVAHAN_60")
   - **Source Type**: Choose from MParivahan, VCourt, or Delhi Police
   - **Region**: Select applicable region or "All Regions"
   - **Settlement Percentage**: Enter percentage (e.g., 60 for 60% settlement)
   - **Year Cutoff**: Optional year restriction
   - **Amount Cutoff**: Optional amount restriction
   - **Active**: Check to enable the rule
3. Click "Save Rule"

### Settlement Percentage Guide

- **60%**: 40% discount (customer pays 60% of original amount)
- **100%**: No discount (customer pays full amount)
- **160%**: 60% penalty (customer pays 160% of original amount - Lok Adalat)

### Editing Rules

1. Click the edit icon (pencil) next to any rule
2. Modify the fields as needed
3. Click "Save Rule"

### Deleting Rules

1. Click the delete icon (trash) next to any rule
2. Confirm the deletion in the popup

### Toggling Active Status

Click the toggle switch in the "Status" column to activate/deactivate rules without deleting them.

## Troubleshooting

### Backend Connection Issues

1. Ensure your backend server is running
2. Check the `REACT_APP_API_URL` in your `.env` file
3. Verify that CORS is enabled in your backend for the frontend URL
4. Check browser developer tools for network errors

### API Endpoint Missing

If you get 404 errors, ensure you've added the settlement-configs API endpoints to your backend as described above.

## Development

### Project Structure

```
src/
├── components/
│   ├── SettlementConfigDashboard.tsx  # Main dashboard component
│   ├── SettlementConfigForm.tsx       # Create/edit form modal
│   └── SettlementConfigTable.tsx      # Data table component
├── services/
│   └── api.ts                         # API service functions
├── types/
│   └── SettlementConfig.ts           # TypeScript type definitions
├── App.tsx                           # Main app component
└── index.tsx                         # Entry point
```

### Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App (not recommended)

## Contributing

1. Make changes to the components as needed
2. Follow TypeScript best practices
3. Use Tailwind CSS for styling
4. Test thoroughly before deployment