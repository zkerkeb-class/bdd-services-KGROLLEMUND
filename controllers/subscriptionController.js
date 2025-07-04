const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un abonnement
const createSubscription = async (req, res) => {
    console.log('🚀 BDD - DÉBUT createSubscription', JSON.stringify(req.body, null, 2));
    try {
        // Vérifier que l'utilisateur existe
        const userId = req.body.userId;
        const stripeSubscriptionId = req.body.stripeSubscriptionId;
        
        if (userId) {
            console.log(`🔍 BDD - Vérification de l'existence de l'utilisateur ${userId}`);
            const userExists = await prisma.user.findUnique({
                where: { id: userId }
            });
            
            if (!userExists) {
                console.error(`❌ BDD - ERREUR: Utilisateur ${userId} non trouvé`);
                return res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé` });
            }
            console.log(`✅ BDD - Utilisateur ${userId} trouvé`);
            
            // Vérifier si cet utilisateur a déjà un abonnement (actif ou non)
            console.log(`🔍 BDD - Vérification d'un abonnement existant pour l'utilisateur ${userId}`);
            const existingSubscription = await prisma.subscription.findFirst({
                where: { userId }
            });
            
            if (existingSubscription) {
                console.log(`✅ BDD - Abonnement existant trouvé, ID: ${existingSubscription.id}`);
                console.log(`📝 BDD - Mise à jour de l'abonnement existant plutôt que d'en créer un nouveau`);
                
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
        console.log(`✅ BDD - Abonnement créé avec succès, ID: ${subscription.id}`);
        console.log(`📦 BDD - Détails de l'abonnement créé:`, JSON.stringify(subscription, null, 2));
        
        // Mettre à jour l'utilisateur avec les nouvelles informations d'abonnement
        if (userId && stripeSubscriptionId) {
            console.log(`📝 BDD - Mise à jour de l'utilisateur ${userId} avec les informations d'abonnement`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isSubscribed: true,
                    subscriptionId: stripeSubscriptionId,
                    numSubscriptionId: subscription.id,
                    subscriptionEndDate: req.body.endDate
                }
            });
            console.log(`✅ BDD - Utilisateur mis à jour avec l'ID d'abonnement ${subscription.id}`);
        }
        
        res.status(201).json(subscription);
        console.log('🏁 BDD - FIN createSubscription - Succès');
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
    console.log(`🚀 BDD - DÉBUT updateSubscription - internalId: ${req.params.id}`, JSON.stringify(req.body, null, 2));
    try {
        const { id } = req.params; // id est en fait internalId (UUID)
        console.log(`🔍 BDD - Mise à jour de l'abonnement via internalId ${id}`);
        
        // Vérifier si l'abonnement existe
        const existingSubscription = await prisma.subscription.findFirst({
            where: { internalId: id }
        });
        
        if (!existingSubscription) {
            console.error(`❌ BDD - ERREUR: Abonnement avec internalId ${id} non trouvé`);
            return res.status(404).json({ error: `Abonnement avec l'ID interne ${id} non trouvé` });
        }
        
        console.log(`💾 BDD - Mise à jour de l'abonnement ${existingSubscription.id}`);
        const subscription = await prisma.subscription.update({
            where: { id: existingSubscription.id }, // La mise à jour se fait sur l'ID numérique
            data: req.body
        });
        console.log(`✅ BDD - Abonnement mis à jour, nouveaux détails:`, JSON.stringify(subscription, null, 2));
        
        res.json(subscription);
        console.log('🏁 BDD - FIN updateSubscription - Succès');
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
    console.log(`🚀 BDD - DÉBUT getSubscription - ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        console.log(`🔍 BDD - Recherche de l'abonnement ${id}`);
        
        const subscription = await prisma.subscription.findUnique({
            where: { id },
            include: { user: true }
        });
        
        if (!subscription) {
            console.error(`❌ BDD - Abonnement ${id} non trouvé`);
            return res.status(404).json({ error: 'Abonnement non trouvé' });
        }
        
        console.log(`✅ BDD - Abonnement trouvé:`, JSON.stringify(subscription, null, 2));
        res.json(subscription);
        console.log('🏁 BDD - FIN getSubscription - Succès');
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
    console.log(`🚀 BDD - DÉBUT getUserSubscriptions - UserID: ${req.params.userId}`);
    try {
        const { userId } = req.params;
        console.log(`🔍 BDD - Recherche des abonnements pour l'utilisateur ${userId}`);
        
        // Vérifier si l'utilisateur existe
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!userExists) {
            console.error(`❌ BDD - Utilisateur ${userId} non trouvé`);
            return res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé` });
        }
        
        const subscriptions = await prisma.subscription.findMany({
            where: { userId }
        });
        
        console.log(`✅ BDD - ${subscriptions.length} abonnement(s) trouvé(s) pour l'utilisateur ${userId}`);
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
    console.log(`🚀 BDD - DÉBUT getSubscriptionByStripeId - StripeID: ${req.params.stripeId}`);
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

module.exports = {
    createSubscription,
    updateSubscription,
    getSubscription,
    getUserSubscriptions,
    getSubscriptionByStripeId
}; 