const express = require('express');
const router = express.Router();
const { signup, login, getUser } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/user', auth, getUser);

module.exports = router;
