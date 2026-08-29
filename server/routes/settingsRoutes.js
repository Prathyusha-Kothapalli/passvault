const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.put('/', settingsController.updateSettings);
router.post('/change-password', settingsController.changeMasterPassword);

module.exports = router;
