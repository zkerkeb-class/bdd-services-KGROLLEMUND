const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour obtenir tous les utilisateurs
router.get('/', userController.getAllUsers);

// Route pour obtenir un utilisateur par email
router.get('/email/:email', userController.getUserByEmail);

// Route pour obtenir un utilisateur par ID
router.get('/:id', userController.getUserById);

// Route pour créer un utilisateur
router.post('/', userController.createUser);

// Route pour mettre à jour un utilisateur
router.put('/:id', userController.updateUser);

// Route pour mettre à jour le statut d'abonnement d'un utilisateur par email
router.put('/subscription/:email', userController.updateUserSubscriptionByEmail);

// Route pour mettre à jour le statut d'abonnement d'un utilisateur
router.put('/:id/subscription', userController.updateUserSubscription);

module.exports = router; 