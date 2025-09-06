const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtenir toutes les analyses d'un utilisateur
const getAnalysesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const analyses = await prisma.analysis.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Créer une nouvelle analyse
const createAnalysis = async (req, res) => {
  try {
    const { userId, fileName, fileType, analysisResult, createdAt } = req.body;
    
    if (!userId || !fileName || !analysisResult) {
      return res.status(400).json({ error: 'Données manquantes (userId, fileName, analysisResult requis)' });
    }

    const analysis = await prisma.analysis.create({
      data: {
        userId,
        fileName,
        fileType,
        analysisResult,
        createdAt: createdAt ? new Date(createdAt) : new Date()
      }
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Error creating analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Obtenir une analyse par ID
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Supprimer une analyse
const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: req.params.id }
    });
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    await prisma.analysis.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAnalysesByUser,
  createAnalysis,
  getAnalysisById,
  deleteAnalysis
}; 