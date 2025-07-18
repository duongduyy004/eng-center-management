const Joi = require('joi');
const { objectId } = require('./custom.validation');


const getPayments = {
    query: Joi.object().keys({
        studentId: Joi.string().custom(objectId),
        classId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020),
        startMonth: Joi.number().integer().min(1).max(12),
        endMonth: Joi.number().integer().min(1).max(12),
        status: Joi.string().valid('pending', 'partial', 'paid'),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
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
    })
};

const sendPaymentReminder = {
    params: Joi.object().keys({
        paymentId: Joi.string().custom(objectId)
    })
};

module.exports = {
    getPayments,
    recordPayment,
    sendPaymentReminder
};