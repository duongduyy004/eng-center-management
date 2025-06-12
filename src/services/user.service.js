const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { deleteAvatar } = require('../middlewares/upload');

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
 * Update user avatar
 * @param {ObjectId} userId
 * @param {string} avatarPath
 * @returns {Promise<User>}
 */
const updateUserAvatar = async (userId, avatarPath) => {
  const user = await getUserById(userId);

  // Delete old avatar if exists
  if (user?.avatar) {
    await deleteAvatar(user.avatar);
  }

  // Update user with new avatar
  Object.assign(user, { avatar: avatarPath });
  await user.save();

  return user;
};

/**
 * Delete user avatar
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserAvatar = async (userId) => {
  const user = await getUserById(userId);

  if (!user.avatar) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not have an avatar');
  }

  // Delete avatar file
  await deleteAvatar(user.avatar);

  // Remove avatar from user
  user.avatar = undefined;
  await user.save();

  return user;
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
  if (updateBody.avatar === null && user.avatar) {
    await deleteAvatar(user.avatar);
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
  updateUserAvatar,
  deleteUserAvatar,
};
