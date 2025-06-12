const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Upload user avatar
 */
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.avatarPath) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No image file provided');
  }
  const userId = req.params.userId || req.user.id;
  const user = await userService.updateUserAvatar(userId, req.avatarPath);

  res.send({
    message: 'Avatar uploaded successfully',
    user: user,
    avatarUrl: req.avatarPath
  });
});

/**
 * Delete user avatar
 */
const deleteAvatar = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const user = await userService.deleteUserAvatar(userId);

  res.send({
    message: 'Avatar deleted successfully',
    user: user
  });
});

/**
 * Upload current user's avatar
 */
const uploadMyAvatar = catchAsync(async (req, res) => {
  if (!req.avatarPath) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No image file provided');
  }

  const user = await userService.updateUserAvatar(req.user.id, req.avatarPath);

  res.send({
    message: 'Avatar uploaded successfully',
    user: user,
    avatarUrl: req.avatarPath
  });
});

/**
 * Delete current user's avatar
 */
const deleteMyAvatar = catchAsync(async (req, res) => {
  const user = await userService.deleteUserAvatar(req.user.id);

  res.send({
    message: 'Avatar deleted successfully',
    user: user
  });
});

/**
 * Get user avatar
 */
const getAvatar = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const user = await userService.getUserById(userId);

  if (!user.avatar) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not have an avatar');
  }

  res.send({
    userId: userId,
    avatarUrl: user.avatar
  });
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  deleteAvatar,
  uploadMyAvatar,
  deleteMyAvatar,
  getAvatar,
};
