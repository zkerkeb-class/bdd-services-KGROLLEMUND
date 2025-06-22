const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seed...');

  // Nettoyer la base de données avant le seed
  console.log('Nettoyage de la base de données...');
  await prisma.professionalProfile.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.quoteRequest.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Base de données nettoyée');

  // Créer un utilisateur classique (sans OAuth)
  const hashedPassword = await bcrypt.hash('Test1234!', 10);
  
  const classicUser = await prisma.user.create({
    data: {
      name: 'Utilisateur Classique',
      email: 'test@example.com',
      password: hashedPassword,
      isVerified: true,
      sector: 'development',
      isProfileCompleted: true
    }
  });
  console.log('Utilisateur classique créé:', classicUser.id);

  // Créer plusieurs utilisateurs OAuth avec le même email
  const googleUser = await prisma.user.create({
    data: {
      name: 'Utilisateur Google',
      email: 'shared@example.com',
      oauthProvider: 'google',
      oauthProviderId: '123456789',
      isVerified: true
    }
  });
  console.log('Utilisateur Google créé:', googleUser.id);

  const linkedinUser = await prisma.user.create({
    data: {
      name: 'Utilisateur LinkedIn',
      email: 'shared@example.com',
      oauthProvider: 'linkedin',
      oauthProviderId: 'linkedin123456',
      isVerified: true
    }
  });
  console.log('Utilisateur LinkedIn créé:', linkedinUser.id);

  const githubUser = await prisma.user.create({
    data: {
      name: 'Utilisateur GitHub',
      email: 'shared@example.com',
      oauthProvider: 'github',
      oauthProviderId: 'github7890',
      isVerified: true
    }
  });
  console.log('Utilisateur GitHub créé:', githubUser.id);

  // Créer un utilisateur classique avec le même email que les utilisateurs OAuth
  const classicSharedUser = await prisma.user.create({
    data: {
      name: 'Utilisateur Classique Partagé',
      email: 'shared@example.com',
      password: hashedPassword,
      isVerified: true
    }
  });
  console.log('Utilisateur classique avec email partagé créé:', classicSharedUser.id);

  // Créer quelques utilisateurs supplémentaires pour tester
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
      isVerified: true
    }
  });
  console.log('Utilisateur admin créé:', adminUser.id);

  const subscribedUser = await prisma.user.create({
    data: {
      name: 'Utilisateur Premium',
      email: 'premium@example.com',
      password: hashedPassword,
      isSubscribed: true,
      isVerified: true,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
    }
  });
  console.log('Utilisateur premium créé:', subscribedUser.id);

  // Créer un profil professionnel pour l'utilisateur classique
  const profile = await prisma.professionalProfile.create({
    data: {
      userId: classicUser.id,
      sector: 'development',
      specialties: ['frontend', 'backend'],
      yearsOfExperience: 5,
      hourlyRate: 75.0,
      skills: ['JavaScript', 'React', 'Node.js', 'Express', 'PostgreSQL'],
      bio: 'Développeur full-stack avec 5 ans d\'expérience',
      certifications: ['AWS Certified Developer', 'MongoDB Certified Developer']
    }
  });
  console.log('Profil professionnel créé:', profile.id);

  console.log('Seed terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 