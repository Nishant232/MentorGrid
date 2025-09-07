const jwt = require('jsonwebtoken');
const { addUser, removeUser, getSocketId, isUserOnline } = require('./utils/socketUsers');
const Message = require('./models/Message');
const User = require('./models/User');
const logger = require('./utils/logger');

module.exports = function(io) {
  // Make io available globally for notifications
  global.io = io;
  
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    logger.info(`User connected: ${userId}, Socket ID: ${socket.id}`);
    
    // Add user to connected users
    addUser(userId, socket.id);
    
    // Join a personal room for direct messages
    socket.join(userId);

    // Emit online status to user's contacts
    socket.broadcast.emit('userOnlineStatus', { userId, status: 'online' });

    // Handle user disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      removeUser(userId);
      socket.broadcast.emit('userOnlineStatus', { userId, status: 'offline' });
    });

    // Handle typing indicator
    socket.on('typing', (receiverId) => {
      socket.to(receiverId).emit('userTyping', { userId });
    });

    socket.on('stopTyping', (receiverId) => {
      socket.to(receiverId).emit('userStoppedTyping', { userId });
    });

    // Handle read receipts
    socket.on('messageRead', async ({ messageId, senderId }) => {
      try {
        // Update message read status in database
        await Message.findByIdAndUpdate(messageId, { read: true, readAt: new Date() });
        
        // Emit to sender that message was read
        socket.to(senderId).emit('messageReadByUser', { messageId, userId });
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });
    
    // Handle private messages
    socket.on('privateMessage', async (data) => {
      try {
        const { receiverId, content, bookingId, threadId, replyTo } = data;
        
        // Validate required fields
        if (!receiverId || !content) {
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }
        
        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('messageError', { error: 'Receiver not found' });
          return;
        }
        
        // Get sender info
        const sender = await User.findById(userId).select('name avatar');
        
        // Create message in database
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
          bookingId: bookingId || null,
          threadId: threadId || null,
          replyTo: replyTo || null
        });
        
        // Format message for sending
        const messageData = {
          _id: message._id,
          sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar
          },
          content: message.content,
          createdAt: message.createdAt,
          bookingId: message.bookingId,
          threadId: message.threadId,
          replyTo: message.replyTo,
          read: message.read,
          readAt: message.readAt
        };
        
        // Send to receiver if online
        socket.to(receiverId).emit('newMessage', messageData);
        
        // Confirm to sender that message was sent
        socket.emit('messageSent', messageData);
        
        logger.info(`Message sent from ${userId} to ${receiverId}`);
      } catch (error) {
        logger.error('Error sending private message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });
    
    // Handle joining booking rooms (for session chat)
    socket.on('joinBookingRoom', (bookingId) => {
      if (!bookingId) return;
      
      const roomId = `booking:${bookingId}`;
      socket.join(roomId);
      logger.info(`User ${userId} joined booking room ${roomId}`);
    });
    
    // Handle booking room messages
    socket.on('bookingMessage', async (data) => {
      try {
        const { bookingId, content, threadId, replyTo } = data;
        
        if (!bookingId || !content) {
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }
        
        // Get sender info
        const sender = await User.findById(userId).select('name avatar');
        
        // Create message with booking reference
        const message = await Message.create({
          sender: userId,
          bookingId,
          content,
          isBookingChat: true,
          threadId: threadId || null,
          replyTo: replyTo || null
        });
        
        const messageData = {
          _id: message._id,
          sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar
          },
          content: message.content,
          createdAt: message.createdAt,
          bookingId,
          threadId: message.threadId,
          replyTo: message.replyTo,
          read: message.read,
          readAt: message.readAt
        };
        
        // Broadcast to all users in the booking room
        const roomId = `booking:${bookingId}`;
        io.to(roomId).emit('newBookingMessage', messageData);
        
        logger.info(`Booking message sent in room ${roomId}`);
      } catch (error) {
        logger.error('Error sending booking message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });
    
    // Get online status of users
    socket.on('getUsersStatus', (userIds) => {
      if (!Array.isArray(userIds)) return;
      
      const statuses = userIds.reduce((acc, id) => {
        acc[id] = isUserOnline(id);
        return acc;
      }, {});
      
      socket.emit('usersStatus', statuses);
    });
    
    // Handle file attachment messages
    socket.on('privateMessageWithAttachments', async (data) => {
      try {
        const { receiverId, content, attachments, threadId, replyTo, bookingId } = data;
        
        // Validate required fields
        if (!receiverId || !content || !attachments || !Array.isArray(attachments)) {
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }
        
        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('messageError', { error: 'Receiver not found' });
          return;
        }
        
        // Get sender info
        const sender = await User.findById(userId).select('name avatar');
        
        // Create message in database
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
          attachments,
          bookingId: bookingId || null,
          threadId: threadId || null,
          replyTo: replyTo || null
        });
        
        // Format message for sending
        const messageData = {
          _id: message._id,
          sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar
          },
          content: message.content,
          attachments: message.attachments,
          createdAt: message.createdAt,
          bookingId: message.bookingId,
          threadId: message.threadId,
          replyTo: message.replyTo,
          read: message.read,
          readAt: message.readAt
        };
        
        // Send to receiver if online
        socket.to(receiverId).emit('newMessage', messageData);
        
        // Confirm to sender that message was sent
        socket.emit('messageSent', messageData);
        
        logger.info(`Message with attachments sent from ${userId} to ${receiverId}`);
      } catch (error) {
        logger.error('Error sending private message with attachments:', error);
        socket.emit('messageError', { error: 'Failed to send message with attachments' });
      }
    });
  });
};
