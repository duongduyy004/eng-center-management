const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const attendanceValidation = require('../../validations/attendance.validation');
const attendanceController = require('../../controllers/attendance.controller');

const router = express.Router();

router
    .route('/all')
    .get(auth('getAttendance'), validate(attendanceValidation.getAttendanceRecords), attendanceController.getAttendanceRecords);

router
    .route('/:attendanceId')
    .get(auth('getAttendance'), validate(attendanceValidation.getAttendance), attendanceController.getAttendance)
    .patch(auth('manageAttendance'), attendanceController.updateAttendanceSession);

// Get today's attendance session for a class
router
    .route('/:classId/today')
    .get(auth('getAttendance'), attendanceController.getTodayAttendanceSession);

// Complete attendance session
router
    .route('/:attendanceId/complete')
    .patch(auth('manageAttendance'), validate(attendanceValidation.completeAttendanceSession), attendanceController.completeAttendanceSession);

module.exports = router;

