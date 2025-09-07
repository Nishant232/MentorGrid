const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'booking_request',
      'booking_confirmed',
      'booking_cancelled',
      'booking_reminder',
      'session_starting',
      'new_message',
      'credit_update',
      'profile_view',
      'feedback_received',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  data: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    threadId: String,
    credits: Number,
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  expiresAt: Date,
  actions: [{
    label: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'button']
    }
  }]
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for age of notification
notificationSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / 1000);
});

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method to create a notification
notificationSchema.statics.create = async function(params) {
  const notification = new this({
    ...params,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days by default
  });
  
  await notification.save();
  
  // TODO: Emit socket event or send push notification here
  
  return notification;
};

// Get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    userId,
    read: false
  });
};

// Mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { userId, read: false },
    { 
      $set: { 
        read: true,
        readAt: new Date()
      }
    }
  );
  
  return result.modifiedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
