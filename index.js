const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();
const { verifySubscriptionEspire } = require('./utils/verifySubscriptionEspire');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3004;

// Import des routes
const routes = require('./routes');

// Configuration CORS plus permissive
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de journalisation pour les requêtes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const contentType = req.headers['content-type'] || '';
  
  console.log(`[${timestamp}] ${method} ${url} - Content-Type: ${contentType}`);
  
  // Pour les requêtes POST, afficher aussi le corps (sauf pour les uploads binaires)
  if (method === 'POST' && contentType.includes('application/json')) {
    console.log('Request Body:', req.body);
  }
  
  // Journaliser la fin de la requête et son statut
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTimestamp = new Date().toISOString();
    console.log(`[${responseTimestamp}] Response ${res.statusCode} for ${method} ${url}`);
    return originalEnd.apply(this, args);
  };
  
  next();
});

// Test de connexion à la base de données
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
    // Test une requête simple
    const userCount = await prisma.user.count();
    console.log(`📊 Current number of users in database: ${userCount}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Route de santé directe
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Service de base de données opérationnel' });
});

// Utilisation des routes directement à la racine pour la compatibilité
app.use('/', routes);

// Utilisation des routes avec le préfixe /api pour la cohérence
app.use('/api', routes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

verifySubscriptionEspire();

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 BDD Service running on port ${PORT}`);
  await testDatabaseConnection();
}); 