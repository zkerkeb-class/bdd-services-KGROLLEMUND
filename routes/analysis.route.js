const express = require('express');
const router = express.Router();
const { 
  getAnalysesByUser, 
  createAnalysis, 
  getAnalysisById, 
  deleteAnalysis 
} = require('../controllers/analysisController');

// Routes pour les analyses
router.get('/user/:userId', getAnalysesByUser);
router.post('/', createAnalysis);
router.get('/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

module.exports = router; 