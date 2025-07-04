const express = require('express');
const router = express.Router();
const { 
    createSubscription, 
    updateSubscription, 
    getSubscription, 
    getUserSubscriptions 
} = require('../controllers/subscriptionController');

// Route pour créer un abonnement
router.post('/', createSubscription);

// Route pour mettre à jour un abonnement
router.patch('/:id', updateSubscription);

// Route pour récupérer un abonnement par ID
router.get('/:id', getSubscription);

// Route pour récupérer les abonnements d'un utilisateur
router.get('/user/:userId', getUserSubscriptions);

module.exports = router; 