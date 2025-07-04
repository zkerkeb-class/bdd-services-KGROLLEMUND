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

// Route pour créer un devis final à partir d'une demande de devis
router.post('/', async (req, res) => {
  try {
    console.log('📄 Réception demande de création de devis:', req.body);
    
    const { 
      quoteRequestId, 
      clientEmail, 
      clientName,
      updatedTasks, 
      totalEstimate, 
      timeEstimate 
    } = req.body;

    console.log('🔍 Validation des données:', {
      quoteRequestId: !!quoteRequestId,
      clientEmail: !!clientEmail,
      clientName: !!clientName,
      updatedTasks: Array.isArray(updatedTasks) ? updatedTasks.length : 'non-array',
      totalEstimate: typeof totalEstimate,
      timeEstimate: typeof timeEstimate
    });

    // Récupérer la demande de devis
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: { user: true }
    });

    if (!quoteRequest) {
      console.error('❌ QuoteRequest non trouvé avec ID:', quoteRequestId);
      return res.status(404).json({ error: 'Quote request not found' });
    }

    console.log('✅ QuoteRequest trouvé:', {
      id: quoteRequest.id,
      userId: quoteRequest.userId,
      title: quoteRequest.title,
      userEmail: quoteRequest.user?.email
    });

    // Créer le devis final
    const quoteData = {
      userId: quoteRequest.userId,
      quoteRequestId: quoteRequestId,
      title: quoteRequest.title,
      description: quoteRequest.description,
      clientEmail: clientEmail || null,
      clientName: clientName || null,
      tasksEstimation: updatedTasks || quoteRequest.tasksEstimation,
      totalEstimate: totalEstimate || quoteRequest.totalEstimate,
      timeEstimate: timeEstimate || quoteRequest.timeEstimate,
      status: 'finalized'
    };
    
    console.log('📊 Données pour création Quote:', {
      userId: quoteData.userId,
      quoteRequestId: quoteData.quoteRequestId,
      title: quoteData.title,
      clientEmail: quoteData.clientEmail,
      clientName: quoteData.clientName,
      tasksCount: Array.isArray(quoteData.tasksEstimation) ? quoteData.tasksEstimation.length : 'non-array',
      totalEstimate: quoteData.totalEstimate,
      timeEstimate: quoteData.timeEstimate,
      status: quoteData.status
    });
    
    const quote = await prisma.quote.create({
      data: quoteData,
      include: { user: true }
    });
    
    console.log('✅ Devis créé:', quote.id);

    // Mettre à jour le statut de la demande de devis
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: 'completed' }
    });

    res.status(201).json(quote);
  } catch (error) {
    console.error('❌ Erreur création devis:');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
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