const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un profil professionnel
exports.createProfile = async (req, res) => {
  try {
    const { userId, sector, specialties, yearsOfExperience} = req.body;
    console.log('📝 Données reçues pour création de profil');
    
    // Vérifier si un profil existe déjà pour cet utilisateur
    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { userId }
    });
    
    if (existingProfile) {
      return res.status(409).json({ message: 'Un profil existe déjà pour cet utilisateur' });
    }
    
    const profile = await prisma.professionalProfile.create({
      data: {
        userId,
        sector,
        specialties: specialties || [],
        yearsOfExperience: yearsOfExperience || 0,

      }
    });
    
    // Mettre à jour le statut de complétion du profil de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { isProfileCompleted: true }
    });
    
    console.log('✅ Profil créé avec succès');
    res.status(201).json(profile);
  } catch (error) {
    console.error('Erreur lors de la création du profil professionnel:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du profil' });
  }
};

// Récupérer un profil par ID utilisateur
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Recherche du profil professionnel pour l'utilisateur`);
    
    if (!userId) {
      console.log('❌ ID utilisateur manquant dans les paramètres');
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log(`❌ Utilisateur non trouvé dans la base de données`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ Utilisateur trouvé, recherche de son profil professionnel`);
    
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      console.log(`❌ Profil professionnel non trouvé pour l'utilisateur `);
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    console.log(`✅ Profil professionnel trouvé pour l'utilisateur`);
    res.json(profile);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un profil
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sector, specialties, yearsOfExperience} = req.body;
    
    // Vérifier si le profil existe
    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { userId }
    });
    
    if (!existingProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Mettre à jour le profil
    const updatedProfile = await prisma.professionalProfile.update({
      where: { userId },
      data: {
        sector: sector || existingProfile.sector,
        specialties: specialties || existingProfile.specialties,
        yearsOfExperience: yearsOfExperience !== undefined ? yearsOfExperience : existingProfile.yearsOfExperience
      }
    });
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un profil
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si le profil existe
    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { userId }
    });
    
    if (!existingProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Supprimer le profil
    await prisma.professionalProfile.delete({
      where: { userId }
    });
    
    res.json({ message: 'Profil supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Middleware pour vérifier l'ID utilisateur
exports.checkUserId = async (req, res, next) => {
  const userId = req.params.userId || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'ID utilisateur requis' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 