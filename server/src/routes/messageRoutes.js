const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/read/:conversationId', markMessagesAsRead);

module.exports = router;

