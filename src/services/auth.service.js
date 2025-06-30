const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { User, OTP, Student, Teacher, Parent } = require('../models')
const otpService = require('./otp.service');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const handleRoleId = async (user) => {
  const userObj = user.toJSON()
  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user.id })
    Object.assign(userObj, { studentId: student.id })
  }
  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: user.id }).select('salaryPerLesson qualifications specialization description')
    Object.assign(userObj, { teacher, teacherId: teacher.id })
  }
  if (user.role === 'parent') {
    const parent = await Parent.findOne({ userId: user.id })
    Object.assign(userObj, { parentId: parent.id })
  }

  return userObj
}

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} email
 * @param {string} newPassword
 * @param {string} resetPasswordOTP
 * @returns {Promise}
 */
const resetPassword = async (email, newPassword, resetPasswordOTP) => {
  try {
    await otpService.verifyOTP(email, resetPasswordOTP);
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new Error();
    }
    const result = await userService.updateUserById(user.id, { password: newPassword });
    await OTP.deleteMany({ email, resetPasswordOTP });

  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

const changePassword = async (user, oldPassword, newPassword) => {
  const checkPassword = await user.isPasswordMatch(oldPassword)
  if (!checkPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is not correct')
  }
  return await userService.updateUserById(user.id, { password: newPassword })
}

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  changePassword,
  verifyEmail,
  handleRoleId
};
