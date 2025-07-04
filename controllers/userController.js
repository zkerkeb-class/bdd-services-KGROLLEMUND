const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeEmail = (email) => {
  if (!email) return null;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return email;

  const [local, domain] = parts;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.replace(/\./g, '')}@${domain}`;
  }
  return email.toLowerCase();
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        sector: true,
        isProfileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer un utilisateur par email
exports.getUserByEmail = async (req, res) => {
  try {
    console.log('Recherche d\'utilisateurs par email EXACT:', req.params.email);
    
    // Vérifier si l'email est fourni
    if (!req.params.email) {
      console.error('Email non fourni dans les paramètres');
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    // Rechercher TOUS les utilisateurs avec cet email EXACT
    const users = await prisma.user.findMany({
      where: { 
        email: req.params.email // Recherche exacte, sensible à la casse
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Inclure le mot de passe pour vérifier les comptes classiques
        isAdmin: true,
        isSubscribed: true,
        verificationToken: true, // Ajout du token de vérification
        isVerified: true,        // Ajout du statut de vérification
        resetToken: true,        // Ajout du token de réinitialisation
        resetTokenExpiry: true,  // Ajout de la date d'expiration du token de réinitialisation
        sector: true,
        isProfileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé avec l\'email EXACT:', req.params.email);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`${users.length} utilisateur(s) trouvé(s) avec l'email EXACT:`, req.params.email);
    
    // Vérifier si la requête vient du service d'authentification
    const isAuthService = req.headers['x-service'] === 'auth-service' || 
                         req.headers.referer?.includes('auth') || 
                         req.get('origin')?.includes('3001');
    
    // Si la requête vient du service d'authentification, renvoyer l'utilisateur complet avec le mot de passe
    if (isAuthService) {
      console.log('Requête du service d\'authentification - renvoi de l\'utilisateur complet');
      // Si un seul utilisateur, renvoyer l'objet directement pour compatibilité
      if (users.length === 1) {
        res.json(users[0]);
      } else {
        // Sinon renvoyer un tableau
        res.json(users);
      }
    } else {
      // Pour les autres services, ne pas renvoyer les mots de passe
      console.log('Requête d\'un autre service - suppression du mot de passe');
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      // Si un seul utilisateur, renvoyer l'objet directement pour compatibilité
      if (users.length === 1) {
        res.json(usersWithoutPasswords[0]);
      } else {
        // Sinon renvoyer un tableau
        res.json(usersWithoutPasswords);
      }
    }
  } catch (error) {
    console.error('Error fetching users by email:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        subscriptionId: true,
        isProfileCompleted: true,
        isVerified: true,
        sector: true,
        accounts: true,
        createdAt: true,
        updatedAt: true,
        verificationToken: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    console.log('Utilisateur trouvé here2', user);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { email, ...restOfBody } = req.body;
    const user = await prisma.user.create({
      data: {
        ...restOfBody,
        email: email,
        normalizedEmail: normalizeEmail(email),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        sector: true,
        isProfileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        sector: true,
        isProfileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Mettre à jour le statut d'abonnement d'un utilisateur
exports.updateUserSubscription = async (req, res) => {
  try {
    const { email } = req.params;
    const { isSubscribed, subscriptionId, subscriptionEndDate } = req.body;
    
    // Vérifier que l'email est fourni
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Préparer les données de mise à jour
    const updateData = {};
    
    if (isSubscribed !== undefined) {
      updateData.isSubscribed = isSubscribed;
    }
    
    if (subscriptionId !== undefined) {
      updateData.subscriptionId = subscriptionId;
    }
    
    if (subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = new Date(subscriptionEndDate);
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        subscriptionId: true,
        subscriptionEndDate: true,
        sector: true,
        isProfileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
