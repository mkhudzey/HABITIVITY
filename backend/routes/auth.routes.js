const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.delete('/delete/:userId', verifyToken, authController.delete);

module.exports = router;
