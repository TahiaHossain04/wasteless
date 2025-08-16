const Chat = require('../models/Chat');
const User = require('../models/User');
const FoodPost = require('../models/FoodPost');

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, foodPostId, message, messageType = 'text' } = req.body;

    // Validate that the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Validate that the food post exists
    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Don't allow sending message to yourself
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const chatMessage = await Chat.create({
      sender: req.user._id,
      receiver: receiverId,
      foodPost: foodPostId,
      message,
      messageType
    });

    const populatedMessage = await Chat.findById(chatMessage._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .populate('foodPost', 'name imageUrl');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get conversation messages
// @route   GET /api/chat/conversation/:foodPostId/:otherUserId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const { foodPostId, otherUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate that the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate that the food post exists
    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Get messages between the two users for this specific food post
    const messages = await Chat.find({
      foodPost: foodPostId,
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .populate('foodPost', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Mark messages as read
    await Chat.updateMany(
      {
        foodPost: foodPostId,
        sender: otherUserId,
        receiver: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    const total = await Chat.countDocuments({
      foodPost: foodPostId,
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's conversations list
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Get all unique conversations for the user
    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: {
            foodPost: '$foodPost',
            otherUser: {
              $cond: {
                if: { $eq: ['$sender', req.user._id] },
                then: '$receiver',
                else: '$sender'
              }
            }
          },
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate the conversations with user and food post details
    const populatedConversations = await Chat.populate(conversations, [
      {
        path: 'lastMessage.sender',
        select: 'username profilePicture'
      },
      {
        path: 'lastMessage.receiver',
        select: 'username profilePicture'
      },
      {
        path: 'lastMessage.foodPost',
        select: 'name imageUrl'
      },
      {
        path: '_id.otherUser',
        select: 'username profilePicture'
      },
      {
        path: '_id.foodPost',
        select: 'name imageUrl'
      }
    ]);

    res.json(populatedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:foodPostId/:senderId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { foodPostId, senderId } = req.params;

    await Chat.updateMany(
      {
        foodPost: foodPostId,
        sender: senderId,
        receiver: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Chat.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Chat.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can delete their message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage
};
