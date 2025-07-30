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
  const { email } = req.params;
  const normalizedEmail = normalizeEmail(email);

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { normalizedEmail: normalizedEmail }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Important pour la vérification du mot de passe
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

    res.json(user);
  } catch (error) {
    console.error(`Error fetching user by email ${email}:`, error);
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
        subscriptionEndDate: true, // Ajouter ce champ
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
    const { id } = req.params;
    const { isSubscribed, subscriptionId, subscriptionEndDate } = req.body;
    
    // Vérifier que l'id est fourni
    if (!id) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id }
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
        updateData.subscriptionEndDate = subscriptionEndDate;
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isSubscribed: true,
        subscriptionId: true,
        subscriptionEndDate: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Mettre à jour le statut d'abonnement d'un utilisateur par email
exports.updateUserSubscriptionByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { isSubscribed, subscriptionEndDate } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!email) {
      return res.status(400).json({ error: 'Email utilisateur requis' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { normalizedEmail: normalizedEmail }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updateData = {};
    if (isSubscribed !== undefined) {
      updateData.isSubscribed = isSubscribed;
    }
    if (subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = subscriptionEndDate;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        isSubscribed: true,
        subscriptionEndDate: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating subscription status by email:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
