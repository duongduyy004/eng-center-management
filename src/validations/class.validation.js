const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createClass = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        grade: Joi.string().required(),
        section: Joi.string().required(),
        year: Joi.number().required(),
        status: Joi.string().valid('upcoming', 'active', 'closed'),
        schedule: Joi.object().keys({
            startDate: Joi.date(),
            endDate: Joi.date(),
            dayOfWeeks: Joi.array().items(Joi.number().min(0).max(6)),
            timeSlots: Joi.object().keys({
                startTime: Joi.string(),
                endTime: Joi.string()
            })
        }),
        feePerLesson: Joi.number().required(),
        maxStudents: Joi.number().required(),
        teacherId: Joi.string().custom(objectId),
        description: Joi.string(),
        totalLessons: Joi.number(),
        room: Joi.string()
    })
};

const getClasses = {
    query: Joi.object().keys({
        year: Joi.number(),
        grade: Joi.string(),
        status: Joi.string().valid('upcoming', 'active', 'closed'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    })
};

const updateClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        name: Joi.string(),
        grade: Joi.string(),
        section: Joi.string(),
        year: Joi.number(),
        status: Joi.string().valid('upcoming', 'active', 'closed'),
        schedule: Joi.object().keys({
            startDate: Joi.date(),
            endDate: Joi.date(),
            dayOfWeeks: Joi.array().items(Joi.number().min(0).max(6)),
            timeSlots: Joi.object().keys({
                startTime: Joi.string(),
                endTime: Joi.string()
            })
        }),
        feePerLesson: Joi.number(),
        maxStudents: Joi.number(),
        teacherId: Joi.string().custom(objectId),
        description: Joi.string(),
        totalLessons: Joi.number(),
        room: Joi.string()
    })
};

const enrollStudent = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        studentId: Joi.string().custom(objectId).required(),
        discountPercent: Joi.number().min(0).max(100)
    })
};

const getClassStudents = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getClassStudentsDetailed = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    })
};

const removeStudentFromClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }
    )
};

const assignTeacherToClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required()
    })
};

const unassignTeacherFromClass = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createClass,
    getClasses,
    getClass,
    updateClass,
    enrollStudent,
    getClassStudents,
    getClassStudentsDetailed,
    removeStudentFromClass,
    assignTeacherToClass,
    unassignTeacherFromClass
};
