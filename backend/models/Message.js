const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: String,
    size: Number,
    mimeType: String
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  metadata: {
    clientMessageId: String,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  system: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ from: 1, to: 1 });
messageSchema.index({ from: 1, read: 1 });
messageSchema.index({ to: 1, read: 1 });

// Virtual for checking if message is edited
messageSchema.virtual('isEdited').get(function() {
  return this.updatedAt > this.createdAt;
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static to get unread count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    to: userId,
    read: false
  });
};

// Static to get thread messages
messageSchema.statics.getThreadMessages = async function(threadId, limit = 50, before = new Date()) {
  return this.find({
    threadId,
    createdAt: { $lt: before }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('from', 'name avatarUrl')
  .populate('to', 'name avatarUrl')
  .lean();
};

// Static to create a system message
messageSchema.statics.createSystemMessage = async function(threadId, content, to) {
  return this.create({
    threadId,
    content,
    from: to, // System messages appear as sent by the recipient
    to,
    system: true,
    read: true // System messages are automatically marked as read
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
