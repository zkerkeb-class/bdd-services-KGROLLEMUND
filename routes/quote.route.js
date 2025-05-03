const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Route pour obtenir tous les devis
router.get('/', async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: { user: true }
    });
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour créer un devis
router.post('/', async (req, res) => {
  try {
    const quote = await prisma.quote.create({
      data: req.body,
      include: { user: true }
    });
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour obtenir un devis par ID
router.get('/:id', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 