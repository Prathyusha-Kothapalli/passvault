const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', vaultController.getAllItems);
router.get('/:id', vaultController.getItemById);
router.post('/', vaultController.createItem);
router.put('/:id', vaultController.updateItem);
router.delete('/:id', vaultController.deleteItem);
router.patch('/:id/favorite', vaultController.toggleFavorite);

module.exports = router;
