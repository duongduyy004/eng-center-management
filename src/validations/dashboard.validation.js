const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getTeacherDashboard = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required()
    })
};

const getParentDashboard = {
    params: Joi.object().keys({
        parentId: Joi.string().custom(objectId).required()
    })
};

const getStudentDashboard = {
    params: Joi.object().keys({
        studentId: Joi.string().custom(objectId).required()
    })
};

module.exports = {
    getTeacherDashboard,
    getParentDashboard,
    getStudentDashboard,
};