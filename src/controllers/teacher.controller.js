const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { teacherService, attendanceService, classService, teacherPaymentService } = require('../services');

const createTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(httpStatus.CREATED).send(teacher);
});

const getTeachers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['isActive', 'specialization']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await teacherService.queryTeachers(filter, options);
    res.send(result);
});

const getTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherById(req.params.teacherId);
    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
    }
    res.send(teacher);
});

const updateTeacher = catchAsync(async (req, res) => {
    const teacher = await teacherService.updateTeacherById(req.params.teacherId, req.body);
    res.send(teacher);
});

const deleteTeacher = catchAsync(async (req, res) => {
    await teacherService.deleteTeacherById(req.params.teacherId);
    res.status(httpStatus.NO_CONTENT).send();
});

// Teacher-specific endpoints
const getMyProfile = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher profile not found');
    }
    res.send(teacher);
});

const updateMyProfile = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher profile not found');
    }
    const updatedTeacher = await teacherService.updateTeacherById(teacher.id, req.body);
    res.send(updatedTeacher);
});

const getMyClasses = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const classes = await classService.getClassesByTeacherId(teacher.id);
    res.send(classes);
});

const getMyAttendance = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const filter = pick(req.query, ['classId', 'date', 'month', 'year']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await attendanceService.getTeacherAttendance(teacher.id, filter, options);
    res.send(result);
});

const createAttendance = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const attendance = await attendanceService.createAttendance({
        ...req.body,
        teacherId: teacher.id
    });
    res.status(httpStatus.CREATED).send(attendance);
});

const updateAttendance = catchAsync(async (req, res) => {
    const attendance = await attendanceService.updateAttendanceById(req.params.attendanceId, req.body);
    res.send(attendance);
});

const getMyPayments = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const filter = pick(req.query, ['month', 'year', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await teacherPaymentService.getTeacherPayments(teacher.id, filter, options);
    res.send(result);
});

const getTeachingStats = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const stats = await teacherService.getTeachingStats(teacher.id);
    res.send(stats);
});

const getClassStudents = catchAsync(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    const hasPermission = await classService.isTeacherOfClass(teacher.id, req.params.classId);
    if (!hasPermission) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }

    const students = await classService.getClassStudents(req.params.classId);
    res.send(students);
});

module.exports = {
    createTeacher,
    getTeachers,
    getTeacher,
    updateTeacher,
    deleteTeacher,
    getMyProfile,
    updateMyProfile,
    getMyClasses,
    getMyAttendance,
    createAttendance,
    updateAttendance,
    getMyPayments,
    getTeachingStats,
    getClassStudents,
};
