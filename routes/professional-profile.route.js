const express = require('express');
const router = express.Router();
const professionalProfileController = require('../controllers/professionalProfileController');

// Middleware pour vérifier l'ID utilisateur
const { checkUserId } = professionalProfileController;

// Créer un profil professionnel
router.post('/', checkUserId, professionalProfileController.createProfile);

// Récupérer un profil par ID utilisateur
router.get('/user/:userId', professionalProfileController.getProfileByUserId);

// Mettre à jour un profil
router.put('/:userId', checkUserId, professionalProfileController.updateProfile);

// Supprimer un profil
router.delete('/:userId', checkUserId, professionalProfileController.deleteProfile);

module.exports = router; 