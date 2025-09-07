const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const MenteeProfile = require('../models/MenteeProfile');
const { createError } = require('../utils/error');
const { uploadSingle } = require('../utils/fileUpload');
const logger = require('../utils/logger');

/**
 * Get current user profile
 * @route GET /api/v1/users/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user with role-specific profile
    const user = await User.findById(userId).select('-refreshToken');
    
    let profile;
    if (user.role === 'mentor') {
      profile = await MentorProfile.findOne({ userId });
    } else if (user.role === 'mentee') {
      profile = await MenteeProfile.findOne({ userId });
    }

    // Get unread counts
    const unreadNotifications = await require('../models/Notification')
      .countDocuments({ userId, read: false });
    
    const unreadMessages = await require('../models/Message')
      .countDocuments({ to: userId, read: false });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          credits: user.credits,
          lastSeen: user.lastSeen,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        },
        profile,
        meta: {
          unreadNotifications,
          unreadMessages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/me
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, ...profileData } = req.body;

    // Update basic user info
    const user = await User.findById(userId);
    if (name) user.name = name;
    await user.save();

    // Update role-specific profile
    let profile;
    if (user.role === 'mentor') {
      profile = await MentorProfile.findOneAndUpdate(
        { userId },
        { $set: profileData },
        { new: true, runValidators: true }
      );
    } else if (user.role === 'mentee') {
      profile = await MenteeProfile.findOneAndUpdate(
        { userId },
        { $set: profileData },
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        },
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 * @route POST /api/v1/users/me/avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const upload = uploadSingle('avatar', 'avatar');
    
    upload(req, res, async (err) => {
      if (err) {
        return next(createError(400, 'Error uploading file', { error: err.message }));
      }

      if (!req.file) {
        return next(createError(400, 'No file uploaded'));
      }

      const user = await User.findById(req.user.id);
      user.avatarUrl = req.file.path; // or S3 URL in production
      await user.save();

      res.json({
        success: true,
        data: {
          avatarUrl: user.avatarUrl
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 * @route PUT /api/v1/users/me/preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timezone, emailNotifications, pushNotifications } = req.body;

    let profile;
    if (req.user.role === 'mentor') {
      profile = await MentorProfile.findOne({ userId });
      if (!profile.preferences) profile.preferences = {};
      if (timezone) profile.preferences.timezone = timezone;
      await profile.save();
    } else if (req.user.role === 'mentee') {
      profile = await MenteeProfile.findOne({ userId });
      if (!profile.preferences) profile.preferences = {};
      if (timezone) profile.preferences.timezone = timezone;
      if (emailNotifications !== undefined) {
        profile.preferences.notificationPreferences.email = emailNotifications;
      }
      if (pushNotifications !== undefined) {
        profile.preferences.notificationPreferences.push = pushNotifications;
      }
      await profile.save();
    }

    res.json({
      success: true,
      data: {
        preferences: profile.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 * @route DELETE /api/v1/users/me
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const user = await User.findById(userId).select('+password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError(401, 'Invalid password');
    }

    // Delete profile based on role
    if (user.role === 'mentor') {
      await MentorProfile.findOneAndDelete({ userId });
    } else if (user.role === 'mentee') {
      await MenteeProfile.findOneAndDelete({ userId });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  updatePreferences,
  deleteAccount
};
