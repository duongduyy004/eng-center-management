const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getAttendanceRecords = {
    query: Joi.object().keys({
        classId: Joi.string().custom(objectId),
        date: Joi.date(),
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
    body: Joi.array().items({
        studentId: Joi.string().custom(objectId).required(),
        name: Joi.string().required(),
        status: Joi.string().valid('present', 'absent', 'late').required(),
        note: Joi.string().allow('').default(''),
        checkedAt: Joi.date()
    }).required()

};

const getTodayAttendanceSession = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId)
    })
}

module.exports = {
    getAttendanceRecords,
    getAttendance,
    updateAttendanceSession,
    getTodayAttendanceSession
};