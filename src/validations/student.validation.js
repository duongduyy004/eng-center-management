const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createStudent = {
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string(),
        }).required(),
        studentData: Joi.object().keys({
            dateOfBirth: Joi.date(),
            address: Joi.string(),
            parentId: Joi.string().custom(objectId),
            classes: Joi.object().keys({
                classId: Joi.string().custom(objectId).required(),
                discountPercent: Joi.number().min(0).max(100).default(0)
            })
        })
    })
};

const getStudents = {
    query: Joi.object().keys({
        name: Joi.string(),
        role: Joi.string(),
        sortBy: Joi.string().valid(
            'createdAt:asc', 'createdAt:desc',
            'name:asc', 'name:desc',
            'email:asc', 'email:desc'
        ),
        limit: Joi.number().integer().min(1).max(100),
        page: Joi.number().integer().min(1)
    })
};

const getStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        populate: Joi.string()
    })
};

const updateStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string(),
            email: Joi.string().email(),
            phone: Joi.string(),
        }),
        studentData: Joi.object().keys({
            dateOfBirth: Joi.date(),
            address: Joi.string(),
            parentId: Joi.string().custom(objectId),
            classId: Joi.string().custom(objectId),
            discountPercent: Joi.number().min(0).max(100)
        })
    })
};

const deleteStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent
};
