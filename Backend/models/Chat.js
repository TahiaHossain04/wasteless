const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  foodPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPost',
    required: [true, 'Food post is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  }
}, {
  timestamps: true
});

// Index for better query performance
chatSchema.index({ sender: 1, receiver: 1, foodPost: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ isRead: 1 });

// Virtual for conversation ID (unique identifier for a conversation)
chatSchema.virtual('conversationId').get(function() {
  const users = [this.sender.toString(), this.receiver.toString()].sort();
  return `${users[0]}-${users[1]}-${this.foodPost.toString()}`;
});

// Method to get chat with populated user details
chatSchema.methods.toJSON = function() {
  const chat = this.toObject();
  chat.conversationId = this.conversationId;
  return chat;
};

module.exports = mongoose.model('Chat', chatSchema);
