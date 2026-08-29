const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', noteController.getAllNotes);
router.get('/:id', noteController.getNoteById);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
