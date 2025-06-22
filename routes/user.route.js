const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour obtenir tous les utilisateurs
router.get('/', userController.getAllUsers);

// Route pour obtenir un utilisateur par email
// Important: Cette route doit être avant la route /:id pour éviter les conflits
router.get('/email/:email', userController.getUserByEmail);

// Route pour obtenir un utilisateur par numéro de téléphone
router.get('/phone/:phoneNumber', userController.getUserByPhoneNumber);

// Route pour obtenir un utilisateur par ID
router.get('/:id', userController.getUserById);

// Route pour créer un utilisateur
router.post('/', userController.createUser);

// Route pour mettre à jour un utilisateur
router.put('/:id', userController.updateUser);

// Route pour mettre à jour le statut d'abonnement d'un utilisateur
router.put('/subscription/:email', userController.updateUserSubscription);

module.exports = router; 