const Joi = require('joi');

const createClass = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        year: Joi.number().required(),
        status: Joi.string(),
        tuition: Joi.number()
    }),
}


module.exports = {
    createClass
}