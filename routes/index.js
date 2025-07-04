const express = require('express');
const router = express.Router();

// Import des routes
const userRoutes = require('./user.route');
const quoteRoutes = require('./quote.route');
const authRoutes = require('./auth.route');
const subscriptionRoutes = require('./subscription.route'); // Import des routes d'abonnement
const professionalProfileRoutes = require('./professional-profile.route'); // Import des routes de profil professionnel
const analysisRoutes = require('./analysis.route'); // Import des routes d'analyse
const quoteRequestRoutes = require('./quote-request.route'); // Import des routes de demandes de devis
// Route de santé
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bdd-service' });
});

// Utilisation des routes
router.use('/users', userRoutes);
router.use('/quotes', quoteRoutes);
router.use('/public', authRoutes); // Routes publiques pour l'authentification
router.use('/subscriptions', subscriptionRoutes); // Routes pour les abonnements
router.use('/professional-profiles', professionalProfileRoutes); // Routes pour les profils professionnels
router.use('/analyses', analysisRoutes); // Routes pour les analyses
router.use('/quote-requests', quoteRequestRoutes); // Routes pour les demandes de devis

module.exports = router; 