const User = require('../models/User');

// @desc    Search users by username or email
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user._id;

    if (!query) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username email avatar bio isOnline lastSeen')
      .limit(20);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for discovering contacts)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username email avatar bio isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username email avatar bio isOnline lastSeen createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUsers,
  getAllUsers,
  getUserById
};

