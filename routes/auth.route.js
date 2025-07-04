const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Fonction utilitaire pour vérifier le format de l'email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Vérifier que tous les champs requis sont présents
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Vérifier le format de l'email
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier que tous les champs requis sont présents
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier si l'utilisateur a un mot de passe (cas OAuth)
    if (!user.password) {
      return res.status(401).json({ 
        message: 'Ce compte utilise une connexion OAuth, veuillez vous connecter avec le fournisseur correspondant' 
      });
    }
    
    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
});

// Route pour gérer l'authentification OAuth (création/mise à jour d'un utilisateur)
router.post('/oauth', async (req, res) => {
  try {
    const { name, email, oauthProvider, oauthProviderId } = req.body;
    
    // Vérifier que tous les champs requis sont présents
    if (!name || !email || !oauthProvider || !oauthProviderId) {
      return res.status(400).json({ message: 'Informations OAuth incomplètes' });
    }
    
    // Rechercher TOUS les utilisateurs avec cet email
    // Note: Normalement l'email est unique, mais on veut vérifier s'il y a des comptes classiques
    // Nous utilisons findFirst au lieu de findUnique pour éviter les erreurs si plusieurs utilisateurs existent
    const users = await prisma.user.findMany({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive' // Ignorer la casse
        }
      }
    });
    
    console.log(`Recherche d'utilisateurs avec l'email ${email}:`, users);
    
    // Vérifier s'il existe un compte classique (sans oauthProvider mais avec password)
    const classicAccount = users.find(u => !u.oauthProvider && u.password);
    
    if (classicAccount) {
      console.log('Compte classique trouvé avec le même email:', classicAccount.id);
      return res.status(409).json({ 
        message: 'Cet email est déjà utilisé avec un compte classique. Veuillez vous connecter avec votre mot de passe.'
      });
    }
    
    // Rechercher un compte OAuth existant avec le même email
    const existingOAuthAccount = users.find(u => u.oauthProvider);
    
    let user;
    
    if (existingOAuthAccount) {
      // Mettre à jour les informations OAuth pour un utilisateur existant avec OAuth
      user = await prisma.user.update({
        where: { id: existingOAuthAccount.id },
        data: {
          oauthProvider,
          oauthProviderId
        }
      });
      console.log('Compte OAuth mis à jour:', user.id);
    } else {
      // Créer un nouvel utilisateur OAuth
      user = await prisma.user.create({
        data: {
          name,
          email,
          oauthProvider,
          oauthProviderId
        }
      });
      console.log('Nouveau compte OAuth créé:', user.id);
    }
    
    // Ne pas renvoyer le mot de passe (s'il existe)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur lors de l\'authentification OAuth:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'authentification OAuth' });
  }
});

module.exports = router; 