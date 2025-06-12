const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const attendanceValidation = require('../../validations/attendance.validation');
const attendanceController = require('../../controllers/attendance.controller');

const router = express.Router();

router
    .route('/')
    .get(auth('getAttendance'), validate(attendanceValidation.getAttendanceRecords), attendanceController.getAttendanceRecords);

router
    .route('/:attendanceId')
    .get(auth('getAttendance'), validate(attendanceValidation.getAttendance), attendanceController.getAttendance)
    .patch(auth('manageAttendance'), attendanceController.updateAttendanceSession);

// Get today's attendance session for a class
router
    .route('/today/:classId/:teacherId')
    .get(auth('getAttendance'), attendanceController.getTodayAttendanceSession);

// Complete attendance session
router
    .route('/:attendanceId/complete')
    .patch(auth('manageAttendance'), validate(attendanceValidation.completeAttendanceSession), attendanceController.completeAttendanceSession);

// Get class attendance statistics
// router
//     .route('/classes/:classId/statistics')
//     .get(auth('getAttendance'), validate(attendanceValidation.getClassAttendanceStatistics), attendanceController.getClassAttendanceStatistics);

// // Get student attendance history
// router
//     .route('/students/:studentId/history')
//     .get(auth('getAttendance'), validate(attendanceValidation.getStudentAttendanceHistory), attendanceController.getStudentAttendanceHistory);

module.exports = router;

