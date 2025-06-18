const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { Student, Teacher, Parent, TeacherPayment } = require('../models');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;
  const userId = await getUserId(req.params)
  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && userId.toString() !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const getUserId = async (params) => {
  if (params.studentId) {
    return (await Student.findById(params.studentId))?.userId
  }
  else if (params.teacherId) {
    return (await Teacher.findById(params.teacherId))?.userId
  }
  else if (params.parentId) {
    return (await Parent.findById(params.parentId))?.userId
  }
  else if (params.teacherPaymentId) {
    const teacher = await TeacherPayment.findById(params.teacherPaymentId).populate('teacherId')
    return (await Teacher.findById(teacher.teacherId))?.userId
  }
}

const auth = (...requiredRights) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

module.exports = auth;
