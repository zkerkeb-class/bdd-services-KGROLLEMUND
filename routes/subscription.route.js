const express = require('express');
const router = express.Router();
const { 
    createSubscription, 
    updateSubscription, 
    getSubscription, 
    getUserSubscriptions,
    getSubscriptionByStripeId,
    updateSubscriptionByStripeId
} = require('../controllers/subscriptionController');

// Route pour créer un abonnement
router.post('/', createSubscription);

// Nouvelle route pour mettre à jour un abonnement via son ID Stripe
router.put('/stripe/:stripeId', updateSubscriptionByStripeId);

// Route pour mettre à jour un abonnement
router.patch('/:id', updateSubscription);

// Route pour récupérer un abonnement par ID
router.get('/:id', getSubscription);

// Route pour récupérer les abonnements d'un utilisateur
router.get('/user/:userId', getUserSubscriptions);

// Route pour récupérer un abonnement par son ID Stripe
router.get('/stripe/:stripeId', getSubscriptionByStripeId);

module.exports = router; 