const Joi = require('joi');
const { objectId } = require('./custom.validation');

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
        teacherId: Joi.string().custom(objectId),
    }),
};

const recordTeacherPayment = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        amount: Joi.number().min(0),
        method: Joi.string().valid('cash', 'bank_transfer', 'cash').default('cash'),
        note: Joi.string().allow(''),
    }),
};


module.exports = {
    getTeacherPayments,
    getTeacherPayment,
    recordTeacherPayment,
};
