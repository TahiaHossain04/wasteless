const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

// Message routes
router.post('/', sendMessage);
router.delete('/:messageId', deleteMessage);

// Conversation routes
router.get('/conversations', getConversations);
router.get('/conversation/:foodPostId/:otherUserId', getConversation);

// Utility routes
router.put('/read/:foodPostId/:senderId', markAsRead);
router.get('/unread', getUnreadCount);

module.exports = router;
