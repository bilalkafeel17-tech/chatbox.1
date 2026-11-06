const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Get all messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify current user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation'
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId, text } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message text are required'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user is part of the conversation
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this conversation'
      });
    }

    // Find the recipient
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== currentUserId.toString()
    );

    const message = await Message.create({
      conversationId,
      sender: currentUserId,
      receiver: receiverId,
      text: text.trim(),
      status: 'sent'
    });

    // Update latest message in conversation
    conversation.latestMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/messages/read/:conversationId
// @access  Private
const markMessagesAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify participation
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update messages in this conversation'
      });
    }

    const updateResult = await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        status: { $ne: 'read' }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesAsRead
};

