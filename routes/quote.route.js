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
    console.log('📄 Réception demande de création de devis');
    
    const { 
      quoteRequestId, 
      clientEmail, 
      clientName,
      updatedTasks, 
      totalEstimate, 
      timeEstimate 
    } = req.body;

    // Récupérer la demande de devis
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: { user: true }
    });

    if (!quoteRequest) {
      console.error('❌ QuoteRequest non trouvé avec ID:', quoteRequestId);
      return res.status(404).json({ error: 'Quote request not found' });
    }

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
    
    
    const quote = await prisma.quote.create({
      data: quoteData,
      include: { user: true }
    });
    
    console.log('✅ Devis créé');

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

// Route pour obtenir tous les devis d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const quotes = await prisma.quote.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // Trier par date de création, le plus récent en premier
      include: { user: true }
    });
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes for user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour obtenir les statistiques des devis d'un utilisateur
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Nombre total de devis
    const totalQuotes = await prisma.quote.count({
      where: { userId: userId },
    });

    // 2. Somme totale gagnée (devis finalisés)
    const finalizedQuotes = await prisma.quote.findMany({
      where: {
        userId: userId,
        status: 'finalized',
      },
    });
    const totalEarned = finalizedQuotes.reduce((sum, quote) => sum + quote.totalEstimate, 0);

    // 3. Revenu mensuel moyen
    let monthlyAverage = 0;
    if (finalizedQuotes.length > 0) {
      // Trouver la date du premier devis finalisé
      const firstQuoteDate = finalizedQuotes.reduce((earliest, quote) => 
        new Date(quote.createdAt) < earliest ? new Date(quote.createdAt) : earliest, 
        new Date()
      );
      
      const now = new Date();
      // Calculer le nombre de mois entre aujourd'hui et la date du premier devis
      const monthsDiff = (now.getFullYear() - firstQuoteDate.getFullYear()) * 12 + (now.getMonth() - firstQuoteDate.getMonth()) + 1;
      
      if (monthsDiff > 0) {
        monthlyAverage = totalEarned / monthsDiff;
      } else {
        monthlyAverage = totalEarned; // Si tout est dans le même mois
      }
    }

    res.json({
      totalQuotes,
      totalEarned,
      monthlyAverage,
    });

  } catch (error) {
    console.error('Error fetching quote stats for user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 