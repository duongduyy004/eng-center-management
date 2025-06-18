const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createTeacher = {
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().required().email(),
            password: Joi.string().required().custom(password),
            phone: Joi.string(),
            address: Joi.string(),
            dayOfBirth: Joi.string(),
            gender: Joi.string().valid('male', 'female', 'other')
        }).required(),
        teacherData: Joi.object().keys({
            salaryPerLesson: Joi.number(),
            qualifications: Joi.array().items(Joi.string()),
            specialization: Joi.array().items(Joi.string()),
            description: Joi.string(),
            isActive: Joi.boolean()
        }).required()
    })
};

const getTeachers = {
    query: Joi.object().keys({
        name: Joi.string(),
        isActive: Joi.boolean(),
        specialization: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getTeacher = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId)
    })
};

const updateTeacher = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string(),
            email: Joi.string().email(),
            phone: Joi.string(),
            address: Joi.string(),
            dayOfBirth: Joi.date(),
            gender: Joi.string().valid('male', 'female', 'other')
        }),
        teacherData: Joi.object().keys({
            salaryPerLesson: Joi.number(),
            qualifications: Joi.array().items(Joi.string()),
            specialization: Joi.array().items(Joi.string()),
            description: Joi.string(),
            isActive: Joi.boolean()
        })
    }).min(1)
};

const deleteTeacher = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId)
    })
};

const getTeacherClasses = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createTeacher,
    getTeachers,
    getTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherClasses
};