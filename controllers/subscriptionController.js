const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un abonnement
const createSubscription = async (req, res) => {
    try {
        // Vérifier que l'utilisateur existe
        const userId = req.body.userId;
        const stripeSubscriptionId = req.body.stripeSubscriptionId;
        
        if (userId) {
            console.log(`🔍 BDD - Vérification de l'existence de l'utilisateur`);
            const userExists = await prisma.user.findUnique({
                where: { id: userId }
            });
            
            if (!userExists) {
                console.error(`❌ BDD - ERREUR: Utilisateur ${userId} non trouvé`);
                return res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé` });
            }
            console.log(`✅ BDD - Utilisateur trouvé`);
            
            // Vérifier si cet utilisateur a déjà un abonnement (actif ou non)
            console.log(`🔍 BDD - Vérification d'un abonnement existant pour l'utilisateur`);
            const existingSubscription = await prisma.subscription.findFirst({
                where: { userId }
            });
            
            if (existingSubscription) {
                console.log(`✅ BDD - Abonnement existant trouvé, ID`);
                console.log(`📝 BDD - Mise à jour de l'abonnement existant`);
                
                // Si stripeSubscriptionId est différent et fourni, on met à jour l'abonnement
                const updateData = {
                    ...req.body
                };
                
                const updatedSubscription = await prisma.subscription.update({
                    where: { id: existingSubscription.id },
                    data: updateData
                });
                
                // Mettre à jour l'utilisateur avec les nouvelles informations d'abonnement
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isSubscribed: true,
                        subscriptionId: stripeSubscriptionId,
                        numSubscriptionId: updatedSubscription.id,
                        subscriptionEndDate: req.body.endDate
                    }
                });
                
                console.log(`✅ BDD - Abonnement mis à jour et utilisateur mis à jour`);
                return res.status(200).json(updatedSubscription);
            }
        }
        
        console.log(`💾 BDD - Création de l'abonnement dans la base de données`);
        const subscription = await prisma.subscription.create({
            data: req.body
        });
        console.log(`✅ BDD - Abonnement créé avec succès, ID`);
        
        // Mettre à jour l'utilisateur avec les nouvelles informations d'abonnement
        if (userId && stripeSubscriptionId) {
            console.log(`📝 BDD - Mise à jour de l'utilisateur avec les informations d'abonnement`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isSubscribed: true,
                    subscriptionId: stripeSubscriptionId,
                    numSubscriptionId: subscription.id,
                    subscriptionEndDate: req.body.endDate
                }
            });
            console.log(`✅ BDD - Utilisateur mis à jour avec l'ID d'abonnement`);
        }
        
        res.status(201).json(subscription);
    } catch (error) {
        console.error('❌ BDD - ERREUR lors de la création de l\'abonnement:', error);
        console.error('📦 BDD - Stack trace:', error.stack);
        
        // Vérifier s'il s'agit d'une erreur de contrainte d'unicité (duplicate)
        if (error.code === 'P2002') {
            console.error(`❌ BDD - Erreur de contrainte unique sur le champ: ${error.meta?.target}`);
            return res.status(409).json({ 
                error: 'Un abonnement avec ces informations existe déjà',
                field: error.meta?.target
            });
        }
        
        // Vérifier s'il s'agit d'une erreur de contrainte de relation
        if (error.code === 'P2003') {
            console.error(`❌ BDD - Erreur de contrainte de relation: ${error.meta?.field_name}`);
            return res.status(400).json({ 
                error: 'Référence invalide',
                field: error.meta?.field_name
            });
        }
        
        res.status(500).json({ 
            error: 'Erreur lors de la création de l\'abonnement',
            details: error.message,
            code: error.code
        });
    }
};

// Mettre à jour un abonnement
const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params; // id est en fait internalId (UUID)
        console.log(`🔍 BDD - Mise à jour de l'abonnement`);
        
        // Vérifier si l'abonnement existe
        const existingSubscription = await prisma.subscription.findFirst({
            where: { internalId: id }
        });
        
        if (!existingSubscription) {
            console.error(`❌ BDD - ERREUR: Abonnement non trouvé`);
            return res.status(404).json({ error: `Abonnement avec l'ID interne ${id} non trouvé` });
        }
        
        console.log(`💾 BDD - Mise à jour de l'abonnement`);
        const subscription = await prisma.subscription.update({
            where: { id: existingSubscription.id }, // La mise à jour se fait sur l'ID numérique
            data: req.body
        });
        console.log(`✅ BDD - Abonnement mis à jour`);
        
        res.json(subscription);
    } catch (error) {
        console.error('❌ BDD - ERREUR lors de la mise à jour de l\'abonnement:', error);
        console.error('📦 BDD - Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour de l\'abonnement',
            details: error.message
        });
    }
};

// Récupérer un abonnement
const getSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 BDD - Récupération de l'abonnement `);
        
        const subscription = await prisma.subscription.findUnique({
            where: { id },
            include: { user: true }
        });
        
        if (!subscription) {
            console.error(`❌ BDD - Abonnement non trouvé`);
            return res.status(404).json({ error: 'Abonnement non trouvé' });
        }
        
        console.log(`✅ BDD - Abonnement trouvé`);
        res.json(subscription);
    } catch (error) {
        console.error('❌ BDD - ERREUR lors de la récupération de l\'abonnement:', error);
        console.error('📦 BDD - Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de l\'abonnement',
            details: error.message
        });
    }
};

// Récupérer les abonnements d'un utilisateur
const getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`🔍 BDD - Recherche des abonnements pour l'utilisateur`);
        
        // Vérifier si l'utilisateur existe
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!userExists) {
            console.error(`❌ BDD - Utilisateur non trouvé`);
            return res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé` });
        }
        
        const subscriptions = await prisma.subscription.findMany({
            where: { userId }
        });
        
        console.log(`✅ BDD - Abonnement(s) trouvé(s) pour l'utilisateur`);
        res.json(subscriptions);
        console.log('🏁 BDD - FIN getUserSubscriptions - Succès');
    } catch (error) {
        console.error('❌ BDD - ERREUR lors de la récupération des abonnements:', error);
        console.error('📦 BDD - Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des abonnements',
            details: error.message
        });
    }
};

// Récupérer un abonnement par ID Stripe
const getSubscriptionByStripeId = async (req, res) => {
    try {
        const { stripeId } = req.params;
        const subscription = await prisma.subscription.findFirst({
            where: {
                stripeSubscriptionId: stripeId,
            },
        });
        
        if (!subscription) {
            return res.status(404).json({ error: 'Abonnement non trouvé avec cet ID Stripe' });
        }
        
        res.json(subscription);
    } catch (error) {
        console.error('❌ BDD - ERREUR lors de la récupération de l\'abonnement par ID Stripe:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de l\'abonnement par ID Stripe',
            details: error.message
        });
    }
};

const updateSubscriptionByStripeId = async (req, res) => {
    const { stripeId } = req.params;
    const data = req.body;

    try {
        console.log(`[LOG] BDD - Tentative de mise à jour de l'abonnement avec Stripe ID: ${stripeId}`);
        const updatedSubscription = await prisma.subscription.update({
            where: {
                stripeSubscriptionId: stripeId,
            },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        if (!updatedSubscription) {
             console.error(`[ERREUR] BDD - Abonnement avec Stripe ID ${stripeId} non trouvé.`);
            return res.status(404).json({ error: 'Abonnement non trouvé avec cet ID Stripe' });
        }

        console.log(`[LOG] BDD - SUCCÈS - Abonnement ${stripeId} mis à jour.`);
        res.status(200).json(updatedSubscription);
    } catch (error) {
        console.error(`[ERREUR] BDD - Échec de la mise à jour de l'abonnement ${stripeId}:`, error);
        if (error.code === 'P2025') {
             return res.status(404).json({ error: 'Abonnement à mettre à jour non trouvé.' });
        }
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour de l\'abonnement par ID Stripe',
            details: error.message 
        });
    }
};

module.exports = {
    createSubscription,
    updateSubscription,
    getSubscription,
    getUserSubscriptions,
    getSubscriptionByStripeId,
    updateSubscriptionByStripeId
}; 