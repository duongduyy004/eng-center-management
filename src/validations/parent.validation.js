const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createParent = {
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string().required().trim(),
            email: Joi.string().email().required(),
            phone: Joi.string().trim(),
            password: Joi.string().min(8).required(),
            dayOfBirth: Joi.string(),
            address: Joi.string(),
            gender: Joi.string(),
        }).required(),
        parentData: Joi.object().keys({
            canSeeTeacherInfo: Joi.boolean().default(true)
        })
    })
};

const getParents = {
    query: Joi.object().keys({
        name: Joi.string().trim(),
        email: Joi.string().email(),
        phone: Joi.string().trim(),
        canSeeTeacherInfo: Joi.boolean(),
        sortBy: Joi.string().valid(
            'createdAt:asc', 'createdAt:desc',
            'name:asc', 'name:desc',
            'email:asc', 'email:desc'
        ),
        limit: Joi.number().integer().min(1).max(100),
        page: Joi.number().integer().min(1),
    })
};

const getParent = {
    params: Joi.object().keys({
        parentId: Joi.string().custom(objectId)
    })
};

const updateParent = {
    params: Joi.object().keys({
        parentId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string().trim(),
            email: Joi.string().email(),
            phone: Joi.string().trim(),
            address: Joi.string(),
            gender: Joi.string()

        }),
        parentData: Joi.object().keys({
            canSeeTeacherInfo: Joi.boolean()
        })
    }).min(1)
};

const deleteParent = {
    params: Joi.object().keys({
        parentId: Joi.string().custom(objectId)
    })
};

const addChild = {
    body: Joi.object().keys({
        parentId: Joi.string().custom(objectId).required(),
        studentId: Joi.string().custom(objectId).required()
    })
};

const deleteChild = {
    body: Joi.object().keys({
        parentId: Joi.string().custom(objectId).required(),
        studentId: Joi.string().custom(objectId).required()
    })
};

const payTuition = {
    body: Joi.object().keys({
        paymentId: Joi.string().custom(objectId).required(),
        amount: Joi.number().positive().required(),
        method: Joi.string().valid('cash', 'bank_transfer', 'credit_card', 'online').required(),
        note: Joi.string().trim()
    })
};



module.exports = {
    createParent,
    getParents,
    getParent,
    updateParent,
    deleteParent,
    addChild,
    deleteChild,
    payTuition,
};
