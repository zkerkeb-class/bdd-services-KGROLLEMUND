// Job planifié - Vérifie les abonnements expirés tous les jours à minuit

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifySubscriptionEspire = async (req, res) => {
cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Lancement de la vérification des abonnements expirés...');
    const axios = require('axios');
    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
    try {
      const now = new Date();
      
      // 1. Trouver tous les abonnements expirés mais encore actifs
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          endDate: {
            lt: now  // Date de fin antérieure à maintenant
          },
          isActive: true
        },
        include: {
          user: true
        }
      });
      
      console.log(`🔍 ${expiredSubscriptions.length} abonnements expirés trouvés`);
      
      // 2. Mettre à jour chaque abonnement expiré
      for (const subscription of expiredSubscriptions) {
        console.log(`📝 Traitement de l'abonnement expiré pour ${subscription.user.email} (ID: ${subscription.id})`);
        
        // Mettre à jour l'abonnement
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            isActive: false,
            status: 'expired'
          }
        });
        
        // Mettre à jour l'utilisateur
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            isSubscribed: false
          }
        });
        
        // Envoyer une notification (optionnel)
        try {
          await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/subscription-notification`, {
            to: subscription.user.email,
            type: 'expired',
            data: {
              subscriptionId: subscription.id,
              endDate: subscription.endDate
            }
          });
          
          console.log(`✅ Notification d'expiration envoyée à ${subscription.user.email}`);
        } catch (notifError) {
          console.error(`❌ Erreur lors de l'envoi de la notification:`, notifError.message);
        }
      }
      
      console.log('✅ Vérification des abonnements expirés terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des abonnements expirés:', error);
    }
  });
};

module.exports = { verifySubscriptionEspire };
