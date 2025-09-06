const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();
const { verifySubscriptionEspire } = require('./utils/verifySubscriptionEspire');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3004;
// À ajouter dans le fichier principal (index.js) de chaque microservice
const promBundle = require('express-prom-bundle');


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
    
  // Pour les requêtes POST, afficher aussi le corps (sauf pour les uploads binaires)
  if (method === 'POST' && contentType.includes('application/json')) {
  }
  
  // Journaliser la fin de la requête et son statut
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTimestamp = new Date().toISOString();
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
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Route de santé directe
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Service de base de données opérationnel' });
});

// Utilisation des routes avec le préfixe /api pour la cohérence
app.use('/api', routes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Middleware Prometheus pour collecter les métriques HTTP
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'bdd-service' }, // Remplacer par le nom du service
  promClient: { collectDefaultMetrics: {} }
});
app.use(metricsMiddleware);

// Route pour exposer les métriques Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end(promBundle.promClient.register.metrics());
});

verifySubscriptionEspire();

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 BDD Service running on port ${PORT}`);
  await testDatabaseConnection();
}); 