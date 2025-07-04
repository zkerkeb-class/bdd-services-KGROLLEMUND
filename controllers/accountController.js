const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeEmail = (email) => {
  if (!email) return null;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return email; // Ne pas traiter les emails invalides

  const [local, domain] = parts;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.replace(/\./g, '')}@${domain}`;
  }
  return email;
};

const findOrCreateOAuthUser = async (req, res) => {
  const { name, provider, providerAccountId } = req.body;
  const originalEmail = req.body.email;
  const normalizedEmailValue = normalizeEmail(originalEmail);

  if (!normalizedEmailValue || !provider || !providerAccountId) {
    return res.status(400).json({ error: 'Email, provider, and providerAccountId are required.' });
  }

  try {
    // 1. Chercher si le compte externe existe déjà
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider,
          providerAccountId: providerAccountId,
        },
      },
      include: { user: true },
    });

    if (account) {
      // Le compte existe, on retourne l'utilisateur associé
      return res.status(200).json({ user: account.user, message: 'User logged in successfully.' });
    }

    // 2. Le compte n'existe pas, chercher si un utilisateur avec cet email NORMALISÉ existe
    let user = await prisma.user.findUnique({
      where: { normalizedEmail: normalizedEmailValue },
    });

    if (user) {
      // L'utilisateur existe, on lie le nouveau compte à cet utilisateur
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: provider,
          providerAccountId: providerAccountId,
        },
      });
      return res.status(200).json({ user, message: 'Account linked successfully.' });
    } else {
      // 3. Ni l'utilisateur, ni le compte n'existent. On crée les deux.
      const newUser = await prisma.user.create({
        data: {
          name: name,
          email: originalEmail, // On garde l'email original
          normalizedEmail: normalizedEmailValue, // On stocke la version normalisée
          isVerified: true,
          accounts: {
            create: {
              provider: provider,
              providerAccountId: providerAccountId,
            },
          },
        },
        include: { accounts: true },
      });
      return res.status(201).json({ user: newUser, message: 'User created and logged in successfully.' });
    }
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    res.status(500).json({ error: 'An error occurred while processing OAuth login.' });
  }
};

module.exports = {
  findOrCreateOAuthUser,
}; 