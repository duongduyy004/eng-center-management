const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { attendanceService } = require('../services');

const getAttendanceRecords = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['classId', 'date', 'isCompleted']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await attendanceService.queryAttendance(filter, options);
    res.send(result);
});

const getAttendance = catchAsync(async (req, res) => {
    const attendance = await attendanceService.getAttendanceById(req.params.attendanceId);
    res.status(httpStatus.OK).json({
        message: 'Get attendance successfully',
        data: attendance
    })
});

const getTodayAttendanceSession = catchAsync(async (req, res) => {
    const { classId } = req.params;
    const attendance = await attendanceService.getTodayAttendanceSession(classId);
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



module.exports = {
    getTodayAttendanceSession,
    getAttendanceRecords,
    getAttendance,
    updateAttendanceSession,
    completeAttendanceSession,
};