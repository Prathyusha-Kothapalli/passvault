const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/export', backupController.exportBackup);
router.post('/import', backupController.importBackup);

module.exports = router;
