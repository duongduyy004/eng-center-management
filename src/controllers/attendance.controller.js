const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { attendanceService } = require('../services');

const createAttendanceSession = catchAsync(async (req, res) => {
    const attendance = await attendanceService.createAttendanceSession(req.body);
    res.status(httpStatus.CREATED).json({
        message: 'Attendance session created successfully',
        data: attendance
    });
});

const getAttendanceRecords = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['classId', 'teacherId', 'date', 'isCompleted']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await attendanceService.queryAttendance(filter, options);
    res.send(result);
});

const getAttendance = catchAsync(async (req, res) => {
    const attendance = await attendanceService.getAttendanceById(req.params.attendanceId);
    res.send(attendance);
});

const getTodayAttendanceSession = catchAsync(async (req, res) => {
    const { classId, teacherId } = req.params;
    const attendance = await attendanceService.getTodayAttendanceSession(classId, teacherId);
    res.send({
        message: 'Today attendance session retrieved successfully',
        data: attendance
    });
});

const updateAttendanceSession = catchAsync(async (req, res) => {
    const { attendanceId } = req.params;
    const { students } = req.body;
    const attendance = await attendanceService.updateAttendanceSession(attendanceId, students);
    res.send({
        message: 'Attendance session updated successfully',
        data: attendance
    });
});

const completeAttendanceSession = catchAsync(async (req, res) => {
    const { attendanceId } = req.params;
    const attendance = await attendanceService.completeAttendanceSession(attendanceId);
    res.send({
        message: 'Attendance session completed successfully',
        data: attendance
    });
});

const generateAttendanceSchedule = catchAsync(async (req, res) => {
    const { classId, schedule, teacherId } = req.body;
    const result = await attendanceService.generateAttendanceSchedule(classId, schedule, teacherId);
    res.status(httpStatus.CREATED).json({
        message: 'Attendance schedule generated successfully',
        data: result
    });
});

const regenerateAttendanceSchedule = catchAsync(async (req, res) => {
    const { classId, schedule, teacherId } = req.body;
    const result = await attendanceService.regenerateAttendanceSchedule(classId, schedule, teacherId);
    res.send({
        message: 'Attendance schedule regenerated successfully',
        data: result
    });
});

// const getClassAttendanceStatistics = catchAsync(async (req, res) => {
//     const { classId } = req.params;
//     const dateRange = pick(req.query, ['startDate', 'endDate']);
//     const statistics = await attendanceService.getClassAttendanceStatistics(classId, dateRange);
//     res.send(statistics);
// });

// const getStudentAttendanceHistory = catchAsync(async (req, res) => {
//     const { studentId } = req.params;
//     const dateRange = pick(req.query, ['startDate', 'endDate']);
//     const history = await attendanceService.getStudentAttendanceHistory(studentId, dateRange);
//     res.send(history);
// });

// const deleteAttendance = catchAsync(async (req, res) => {
//     await attendanceService.deleteAttendanceById(req.params.attendanceId, req.user);
//     res.status(httpStatus.NO_CONTENT).send();
// });

module.exports = {
    createAttendanceSession,
    getTodayAttendanceSession,
    getAttendanceRecords,
    getAttendance,
    updateAttendanceSession,
    completeAttendanceSession,
    generateAttendanceSchedule,
    regenerateAttendanceSchedule
    // getClassAttendanceStatistics,
    // getStudentAttendanceHistory,
    // deleteAttendance
};