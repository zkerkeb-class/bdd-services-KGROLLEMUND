const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3004;

// Import des routes
const routes = require('./routes');

app.use(cors());
app.use(express.json());

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

// Utilisation des routes directement à la racine
app.use('/', routes);

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 BDD Service running on port ${PORT}`);
  await testDatabaseConnection();
}); 