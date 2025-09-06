const express = require('express');
const router = express.Router();
const { 
  getQuoteRequestsByUser, 
  createQuoteRequest, 
  getQuoteRequestById, 
  updateQuoteRequest,
  deleteQuoteRequest 
} = require('../controllers/quoteRequestController');

// Routes pour les demandes de devis
router.get('/user/:userId', getQuoteRequestsByUser);
router.post('/', createQuoteRequest);
router.get('/:id', getQuoteRequestById);
router.put('/:id', updateQuoteRequest);
router.delete('/:id', deleteQuoteRequest);

module.exports = router; 