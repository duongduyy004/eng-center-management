const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPayment = {
    body: Joi.object().keys({
        studentId: Joi.string().custom(objectId).required(),
        classId: Joi.string().custom(objectId).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        year: Joi.number().integer().min(2020).max(2030).required(),
        totalLessons: Joi.number().integer().min(1).required(),
        feePerLesson: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).default(0),
        attendedLessons: Joi.number().integer().min(0).default(0),
        note: Joi.string().allow('').default('')
    })
};

const getPayments = {
    query: Joi.object().keys({
        studentId: Joi.string().custom(objectId),
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'partial', 'paid', 'overdue'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getPayment = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    })
};

const updatePayment = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    }),
    body: Joi.object()
        .keys({
            totalLessons: Joi.number().integer().min(1),
            feePerLesson: Joi.number().min(0),
            discountPercent: Joi.number().min(0).max(100),
            attendedLessons: Joi.number().integer().min(0),
            note: Joi.string().allow('')
        })
        .min(1)
};

const deletePayment = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    })
};

const recordPayment = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        amount: Joi.number().min(0.01).required(),
        method: Joi.string().valid('cash', 'bank_transfer', 'card').default('cash'),
        note: Joi.string().allow('').default(''),
        receivedBy: Joi.string().custom(objectId).required()
    })
};

const getPaymentStatistics = {
    query: Joi.object().keys({
        studentId: Joi.string().custom(objectId),
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'partial', 'paid', 'overdue')
    })
};

const getPaymentsByStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'partial', 'paid', 'overdue'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getPaymentsByClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        studentId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        status: Joi.string().valid('pending', 'partial', 'paid', 'overdue'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getMonthlyPaymentReport = {
    params: Joi.object().keys({
        month: Joi.number().integer().min(1).max(12).required(),
        year: Joi.number().integer().min(2020).max(2030).required()
    })
};

const markPaymentOverdue = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    })
};

const getOverduePayments = {
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const sendPaymentReminder = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createPayment,
    getPayments,
    getPayment,
    updatePayment,
    deletePayment,
    recordPayment,
    getPaymentStatistics,
    getPaymentsByStudent,
    getPaymentsByClass,
    getMonthlyPaymentReport,
    markPaymentOverdue,
    getOverduePayments,
    sendPaymentReminder
};