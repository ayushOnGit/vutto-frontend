// ========================================
// BACKEND API ENDPOINTS FOR SETTLEMENT CONFIGURATION
// ========================================
// 
// Add this file to your backend: challan-backend/api/routes/settlement-configs.js
// Then register it in challan-backend/api/routes/index.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/settlement-configs - Get all settlement configurations
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
    console.error('Error fetching settlement configs:', error);
    res.status(500).json({ error: 'Failed to fetch settlement configurations' });
  }
});

// GET /api/settlement-configs/:id - Get settlement configuration by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const config = await prisma.settlement_configs.findUnique({
      where: { id }
    });
    
    if (!config) {
      return res.status(404).json({ error: 'Settlement configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching settlement config:', error);
    res.status(500).json({ error: 'Failed to fetch settlement configuration' });
  }
});

// POST /api/settlement-configs - Create new settlement configuration
router.post('/', async (req, res) => {
  try {
    const {
      rule_name,
      source_type,
      region,
      challan_year_cutoff,
      amount_cutoff,
      settlement_percentage,
      is_active
    } = req.body;

    // Validation
    if (!rule_name || !source_type || !region || settlement_percentage === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: rule_name, source_type, region, settlement_percentage' 
      });
    }

    if (settlement_percentage < 0 || settlement_percentage > 1000) {
      return res.status(400).json({ 
        error: 'Settlement percentage must be between 0 and 1000' 
      });
    }

    const config = await prisma.settlement_configs.create({
      data: {
        rule_name,
        source_type,
        region,
        challan_year_cutoff: challan_year_cutoff || null,
        amount_cutoff: amount_cutoff || null,
        settlement_percentage: parseFloat(settlement_percentage),
        is_active: is_active !== false // Default to true
      }
    });
    
    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating settlement config:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A settlement configuration with this rule name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create settlement configuration' });
    }
  }
});

// PUT /api/settlement-configs/:id - Update settlement configuration
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      rule_name,
      source_type,
      region,
      challan_year_cutoff,
      amount_cutoff,
      settlement_percentage,
      is_active
    } = req.body;

    // Validation
    if (settlement_percentage !== undefined) {
      if (settlement_percentage < 0 || settlement_percentage > 1000) {
        return res.status(400).json({ 
          error: 'Settlement percentage must be between 0 and 1000' 
        });
      }
    }

    const config = await prisma.settlement_configs.update({
      where: { id },
      data: {
        ...(rule_name && { rule_name }),
        ...(source_type && { source_type }),
        ...(region && { region }),
        challan_year_cutoff: challan_year_cutoff || null,
        amount_cutoff: amount_cutoff || null,
        ...(settlement_percentage !== undefined && { settlement_percentage: parseFloat(settlement_percentage) }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date()
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error updating settlement config:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Settlement configuration not found' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'A settlement configuration with this rule name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update settlement configuration' });
    }
  }
});

// DELETE /api/settlement-configs/:id - Delete settlement configuration
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.settlement_configs.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting settlement config:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Settlement configuration not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete settlement configuration' });
    }
  }
});

// PATCH /api/settlement-configs/:id/toggle - Toggle active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean value' });
    }

    const config = await prisma.settlement_configs.update({
      where: { id },
      data: { 
        is_active,
        updated_at: new Date()
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error toggling settlement config:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Settlement configuration not found' });
    } else {
      res.status(500).json({ error: 'Failed to toggle settlement configuration' });
    }
  }
});

module.exports = router;

// ========================================
// TO REGISTER THIS ROUTE IN YOUR BACKEND:
// ========================================
//
// Add this line to your challan-backend/api/routes/index.js:
// 
// const settlementConfigsRoute = require('./settlement-configs');
// router.use('/api/settlement-configs', settlementConfigsRoute);
//
// This will enable all the API endpoints that the frontend expects.

