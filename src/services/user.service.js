const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { cloudinary } = require('../config/cloudinary');
const logger = require('../config/logger');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Upload user avatar
 * @param {ObjectId} userId
 * @param {string} avatarUrl - Cloudinary URL
 * @returns {Promise<User>}
 */
const uploadAvatar = async (userId, avatarUrl) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Delete old avatar from Cloudinary if exists
  if (user.avatar && user.avatar.includes('cloudinary')) {
    try {
      await deleteAvatar(user.avatar);
    } catch (error) {
      logger.warn('Failed to delete old avatar:', error.message);
    }
  }

  // Update user with new avatar URL
  Object.assign(user, { avatar: avatarUrl });
  await user.save();
  return user;
};

/**
 * Delete avatar from Cloudinary
 * @param {string} avatarUrl - Cloudinary URL
 * @returns {Promise<void>}
 */
const deleteAvatar = async (avatarUrl) => {
  try {
    const publicId = extractPublicIdFromUrl(avatarUrl);
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        logger.info(`Successfully deleted avatar with public ID: ${publicId}`);
      } else {
        logger.warn(`Failed to delete avatar with public ID: ${publicId}, result: ${result.result}`);
      }
    }
  } catch (error) {
    logger.error('Error deleting avatar from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url
 * @returns {string}
 */
const extractPublicIdFromUrl = (url) => {
  try {
    // Handle different Cloudinary URL formats
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/english-center/avatars/avatar-1234567890-abc123.jpg
    const regex = /\/([^\/]+\/[^\/]+\/[^\/]+)\.(?:jpg|jpeg|png|gif|webp)$/i;
    const match = url.match(regex);

    if (match) {
      return match[1]; // This includes the folder path
    }

    // Fallback: try to extract just the filename without extension
    const filenameMatch = url.match(/\/([^\/]+)\.[^\/]+$/);
    if (filenameMatch) {
      return `english-center/avatars/${filenameMatch[1]}`;
    }

    return null;
  } catch (error) {
    logger.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.email) {
    updateBody = { ...updateBody, isEmailVerified: false }
  }

  // Handle avatar deletion if needed
  if (updateBody.avatar === null && user.avatar && user.avatar.includes('cloudinary')) {
    try {
      await deleteAvatar(user.avatar);
    } catch (error) {
      logger.warn('Failed to delete avatar during user update:', error.message);
    }
    updateBody.avatar = undefined;
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Delete user's avatar from Cloudinary if exists
  if (user.avatar && user.avatar.includes('cloudinary')) {
    try {
      await deleteAvatar(user.avatar);
    } catch (error) {
      logger.warn('Failed to delete avatar during user deletion:', error.message);
    }
  }

  await user.delete();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  uploadAvatar,
  deleteAvatar,
};
