const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtenir toutes les demandes de devis d'un utilisateur
const getQuoteRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const quoteRequests = await prisma.quoteRequest.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quoteRequests);
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Créer une nouvelle demande de devis
const createQuoteRequest = async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      description, 
      documentType, 
      aiAnalysis, 
      tasksEstimation,
      totalEstimate,
      timeEstimate,
      status = 'analysed'
    } = req.body;
    
    if (!userId || !title || !description) {
      return res.status(400).json({ error: 'Données manquantes (userId, title, description requis)' });
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        userId,
        title,
        description,
        documentType,
        aiAnalysis: aiAnalysis ? (typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis) : null,
        tasksEstimation: tasksEstimation || [],
        totalEstimate: totalEstimate ? parseFloat(totalEstimate) : null,
        timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
        status
      }
    });
    
    res.status(201).json(quoteRequest);
  } catch (error) {
    console.error('Error creating quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Obtenir une demande de devis par ID
const getQuoteRequestById = async (req, res) => {
  try {
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    
    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }
    
    res.json(quoteRequest);
  } catch (error) {
    console.error('Error fetching quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mettre à jour une demande de devis
const updateQuoteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id }
    });
    
    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }
    
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id },
      data: updateData
    });
    
    res.json(updatedQuoteRequest);
  } catch (error) {
    console.error('Error updating quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Supprimer une demande de devis
const deleteQuoteRequest = async (req, res) => {
  try {
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }
    
    await prisma.quoteRequest.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Quote request deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getQuoteRequestsByUser,
  createQuoteRequest,
  getQuoteRequestById,
  updateQuoteRequest,
  deleteQuoteRequest
}; 