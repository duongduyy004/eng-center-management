const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createTeacherPayment = {
    body: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
        classId: Joi.string().custom(objectId).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        year: Joi.number().integer().min(2020).max(2030).required(),
        totalLessons: Joi.number().integer().min(0).required(),
        salaryPerLesson: Joi.number().min(0).required(),
        notes: Joi.string().allow(''),
    }),
};

const getTeacherPayments = {
    query: Joi.object().keys({
        teacherId: Joi.string().custom(objectId),
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'paid'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getTeacherPayment = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
};

const updateTeacherPayment = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            totalLessons: Joi.number().integer().min(0),
            salaryPerLesson: Joi.number().min(0),
            notes: Joi.string().allow(''),
        })
        .min(1),
};

const deleteTeacherPayment = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
};

const markTeacherPaymentAsPaid = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        method: Joi.string().valid('cash', 'bank_transfer').default('cash'),
        note: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    }),
};

const getTeacherPaymentsByTeacher = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId),
    }),
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getTeacherPaymentsByMonth = {
    params: Joi.object().keys({
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
    }),
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getTeacherPaymentStatistics = {
    query: Joi.object().keys({
        teacherId: Joi.string().custom(objectId),
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'paid', 'overdue'),
    }),
};

const getOverdueTeacherPayments = {
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const recordTeacherPayment = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        amount: Joi.number().min(0),
        method: Joi.string().valid('cash', 'bank_transfer').default('cash'),
        note: Joi.string().allow(''),
        notes: Joi.string().allow(''),
    }),
};

const markTeacherPaymentOverdue = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        notes: Joi.string().allow(''),
    }),
};

const generateTeacherPayment = {
    params: Joi.object().keys({
        teacherPaymentId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
        classId: Joi.string().custom(objectId).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        year: Joi.number().integer().min(2020).max(2030).required(),
        notes: Joi.string().allow(''),
    }),
};

module.exports = {
    getTeacherPayments,
    getTeacherPayment,
    updateTeacherPayment,
    deleteTeacherPayment,
    getTeacherPaymentsByTeacher,
    getTeacherPaymentsByMonth,
    getTeacherPaymentStatistics,
    getOverdueTeacherPayments,
    recordTeacherPayment,
    markTeacherPaymentOverdue,
    generateTeacherPayment,
};
