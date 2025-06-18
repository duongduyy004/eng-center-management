const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { teacherService } = require('../services');

const createTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(httpStatus.CREATED).json({
        message: 'Create teacher successfully',
        data: teacher
    })
});

const getTeachers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'isActive', 'specialization']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await teacherService.queryTeachers(filter, options);
    res.send(result);
});

const getTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherById(req.params.teacherId);
    res.send(teacher);
});

const updateTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.updateTeacherById(req.params.teacherId, req.body, req?.user.role);
    res.send(teacher);
});

const deleteTeacher = catchAsync(async (req, res) => {
    await teacherService.deleteTeacherById(req.params.teacherId);
    res.status(httpStatus.NO_CONTENT).send();
});

const getAvailableTeachers = catchAsync(async (req, res) => {
    const teachers = await teacherService.getAvailableTeachers();
    res.send({
        message: 'Available teachers retrieved successfully',
        data: teachers
    });
});

const getTeacherClasses = catchAsync(async (req, res) => {
    const classes = await teacherService.getTeacherClasses(req.params.teacherId);
    res.send({
        message: 'Teacher classes retrieved successfully',
        data: classes
    });
});

module.exports = {
    createTeacher,
    getTeachers,
    getTeacher,
    updateTeacher,
    deleteTeacher,
    getAvailableTeachers,
    getTeacherClasses
};
