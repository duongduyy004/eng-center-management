const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAttendanceSession = {
    body: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
        date: Joi.date(),
        teacherId: Joi.string().custom(objectId).required()
    })
};

const getAttendanceRecords = {
    query: Joi.object().keys({
        classId: Joi.string().custom(objectId),
        teacherId: Joi.string().custom(objectId),
        date: Joi.date(),
        isCompleted: Joi.boolean(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getAttendance = {
    params: Joi.object().keys({
        attendanceId: Joi.string().custom(objectId)
    })
};

const updateAttendanceSession = {
    params: Joi.object().keys({
        attendanceId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        students: Joi.array().items(
            Joi.object().keys({
                studentId: Joi.string().custom(objectId).required(),
                status: Joi.string().valid('present', 'absent', 'late').required(),
                note: Joi.string().allow('').default('')
            })
        ).required()
    })
};

const completeAttendanceSession = {
    params: Joi.object().keys({
        attendanceId: Joi.string().custom(objectId)
    })
};

const getClassAttendanceStatistics = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date()
    })
};

const getStudentAttendanceHistory = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId)
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date()
    })
};

const deleteAttendance = {
    params: Joi.object().keys({
        attendanceId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createAttendanceSession,
    getAttendanceRecords,
    getAttendance,
    updateAttendanceSession,
    completeAttendanceSession,
    getClassAttendanceStatistics,
    getStudentAttendanceHistory,
    deleteAttendance
};