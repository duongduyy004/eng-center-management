const Joi = require('joi');
const { objectId, password } = require('./custom.validation');

const createStudent = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(password),
        phone: Joi.string(),
        address: Joi.string(),
        dayOfBirth: Joi.string(),
        gender: Joi.string().valid('male', 'female', 'other')
    })
};

const getStudents = {
    query: Joi.object().keys({
        name: Joi.string(),
        email: Joi.string().email(),
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
    })
};

const updateStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        userData: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            dayOfBirth: Joi.string(),
            address: Joi.string(),
            gender: Joi.string(),
            phone: Joi.string(),
        }),
        studentData: Joi.array().items(
            Joi.object().keys({
                classId: Joi.string().custom(objectId),
                discountPercent: Joi.number().min(0).max(100),
                status: Joi.string()
            }))
    })
};

const deleteStudent = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    })
};

const getMonthlyChanges = {
    query: Joi.object().keys({
        year: Joi.number().integer().min(2020).max(2030),
        month: Joi.number().integer().min(1).max(12),
        classId: Joi.string().custom(objectId)
    })
};

const getSchedule = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    })
};

const getStudentAttendance = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date().greater(Joi.ref('startDate')),
        classId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    getMonthlyChanges,
    getSchedule,
    getStudentAttendance
};
