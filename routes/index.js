const express = require('express');
const router = express.Router();

// Import des routes
const userRoutes = require('./user.route');
const quoteRoutes = require('./quote.route');
const authRoutes = require('./auth.route');

// Route de santé
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bdd-service' });
});

// Utilisation des routes
router.use('/users', userRoutes);
router.use('/quotes', quoteRoutes);
router.use('/public', authRoutes); // Routes publiques pour l'authentification

module.exports = router; 