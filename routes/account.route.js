const express = require('express');
const router = express.Router();
const { findOrCreateOAuthUser } = require('../controllers/accountController');

router.post('/oauth/user', findOrCreateOAuthUser);

module.exports = router; 