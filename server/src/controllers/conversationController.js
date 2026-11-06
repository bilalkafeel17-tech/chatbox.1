const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for the authenticated user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Find conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender receiver',
          select: 'username avatar'
        }
      })
      .sort({ updatedAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: currentUserId,
          status: { $ne: 'read' }
        });

        const convObj = conv.toObject();
        // identify other participant
        convObj.otherParticipant = convObj.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create a conversation with a specific user
// @route   POST /api/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient user ID is required'
      });
    }

    if (recipientId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a conversation with yourself'
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Look for existing conversation between these two participants
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 }
    })
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender receiver',
          select: 'username avatar'
        }
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId]
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username email avatar bio isOnline lastSeen');
    }

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      receiver: currentUserId,
      status: { $ne: 'read' }
    });

    const convObj = conversation.toObject();
    convObj.otherParticipant = convObj.participants.find(
      (p) => p._id.toString() !== currentUserId.toString()
    );
    convObj.unreadCount = unreadCount;

    res.status(200).json({
      success: true,
      data: convObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender receiver',
          select: 'username avatar'
        }
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check authorization: user must be a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this conversation'
      });
    }

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      receiver: currentUserId,
      status: { $ne: 'read' }
    });

    const convObj = conversation.toObject();
    convObj.otherParticipant = convObj.participants.find(
      (p) => p._id.toString() !== currentUserId.toString()
    );
    convObj.unreadCount = unreadCount;

    res.status(200).json({
      success: true,
      data: convObj
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getConversationById
};

