const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getConversationById
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:id', getConversationById);

module.exports = router;

