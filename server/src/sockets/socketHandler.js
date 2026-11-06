const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Map to track active user sockets: userId -> Set of socket IDs
const userSockets = new Map();

const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('username email avatar isOnline');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.username} (${socket.id})`);

    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user:${userId}`);

    // Update user status in database & broadcast if this is their first active socket
    if (userSockets.get(userId).size === 1) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      io.emit('user_status', {
        userId,
        isOnline: true,
        lastSeen: new Date()
      });
    }

    // Join a conversation room with authorization check
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error_message', { message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );

        if (!isParticipant) {
          return socket.emit('error_message', {
            message: 'Unauthorized access to conversation room'
          });
        }

        socket.join(`conv:${conversationId}`);
        console.log(`[Socket] User ${socket.user.username} joined room conv:${conversationId}`);
      } catch (err) {
        console.error('[Socket] join_conversation error:', err.message);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
        console.log(`[Socket] User ${socket.user.username} left room conv:${conversationId}`);
      }
    });

    // Send real-time message
    socket.on('send_message', async ({ conversationId, text }, callback) => {
      try {
        if (!conversationId || !text || !text.trim()) {
          if (callback) callback({ success: false, error: 'Invalid message payload' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, error: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );

        if (!isParticipant) {
          if (callback) callback({ success: false, error: 'Unauthorized to send message in this conversation' });
          return;
        }

        const receiverId = conversation.participants.find(
          (p) => p.toString() !== userId
        );

        // Check if receiver is online to determine initial delivery status
        const isReceiverOnline = userSockets.has(receiverId.toString()) && userSockets.get(receiverId.toString()).size > 0;
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

        // Persist message in MongoDB
        const newMessage = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
          status: initialStatus
        });

        // Update latest message in conversation
        conversation.latestMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        // Broadcast to conversation room (including sender)
        io.to(`conv:${conversationId}`).emit('receive_message', populatedMessage);

        // Also emit notification to recipient's personal room so their sidebar updates even if room isn't active
        io.to(`user:${receiverId.toString()}`).emit('new_message_notification', {
          conversationId,
          message: populatedMessage
        });

        if (callback) {
          callback({ success: true, data: populatedMessage });
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing start indicator
    socket.on('typing_start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          username: socket.user.username
        });
      }
    });

    // Typing stop indicator
    socket.on('typing_stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
          conversationId,
          userId
        });
      }
    });

    // Mark messages as read
    socket.on('mark_as_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const updateResult = await Message.updateMany(
          {
            conversationId,
            receiver: userId,
            status: { $ne: 'read' }
          },
          {
            $set: {
              status: 'read',
              readAt: new Date()
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          // Notify the conversation room that messages were read
          io.to(`conv:${conversationId}`).emit('messages_read', {
            conversationId,
            readerId: userId,
            readAt: new Date()
          });

          // Also notify sender directly in case they are outside the room
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            const senderId = conversation.participants.find(
              (p) => p.toString() !== userId
            );
            if (senderId) {
              io.to(`user:${senderId.toString()}`).emit('messages_read', {
                conversationId,
                readerId: userId,
                readAt: new Date()
              });
            }
          }
        }
      } catch (err) {
        console.error('[Socket] mark_as_read error:', err.message);
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.username} (${socket.id})`);
      const userSocketSet = userSockets.get(userId);

      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);

          const lastSeenDate = new Date();
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: lastSeenDate
          });

          io.emit('user_status', {
            userId,
            isOnline: false,
            lastSeen: lastSeenDate
          });
        }
      }
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  userSockets
};

