const Message = require('../models/Message');
const User = require('../models/User');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendMessage = async (req, res) => {
  const { receiverId, content, bookingId } = req.body;
  const senderId = req.user.id;

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new NotFoundError('Receiver not found');
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
    bookingId
  });

  // Emit real-time notification
  const io = req.app.get('io');
  io.to(receiverId.toString()).emit('newMessage', {
    messageId: message._id,
    senderId,
    senderName: req.user.name,
    content: message.content
  });

  res.status(201).json({
    status: 'success',
    data: { message }
  });
};

/**
 * Get conversation history with a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversation = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId }
    ]
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar');

  // Mark messages as read
  await Message.updateMany(
    {
      sender: userId,
      receiver: currentUserId,
      read: false
    },
    { read: true }
  );

  res.status(200).json({
    status: 'success',
    data: { messages }
  });
};

/**
 * Get list of conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.listConversations = async (req, res) => {
  const userId = req.user.id;

  // Get the last message from each conversation
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$sender', userId] },
            then: '$receiver',
            else: '$sender'
          }
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$receiver', userId] },
                { $eq: ['$read', false] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user: {
          _id: 1,
          name: 1,
          avatar: 1
        },
        lastMessage: 1,
        unreadCount: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { conversations }
  });
};

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError('Message not found');
  }

  // Only sender can delete the message
  if (message.sender.toString() !== userId) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  await message.remove();

  res.status(204).send();
};

/**
 * Get unread message count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await Message.countDocuments({
    receiver: userId,
    read: false
  });

  res.status(200).json({
    status: 'success',
    data: { unreadCount }
  });
};
