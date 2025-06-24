const express = require('express')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { studentController } = require('../../controllers')
const { studentValidation } = require('../../validations')
const router = express.Router()

router.route('/')
    .post(auth('manageStudents'), validate(studentValidation.createStudent), studentController.createStudent)
    .get(auth('getStudents'), validate(studentValidation.getStudents), studentController.getStudents)

router.get('/monthly-changes', auth('getStudents'), validate(studentValidation.getMonthlyChanges), studentController.getMonthlyStudentChanges);

router.route('/:studentId')
    .get(auth('manageStudents'), validate(studentValidation.getStudent), studentController.getStudent)
    .patch(auth('manageStudents'), validate(studentValidation.updateStudent), studentController.updateStudent)
    .delete(auth('manageStudents'), validate(studentValidation.deleteStudent), studentController.deleteStudent)

// Get student schedule
router.get('/:studentId/schedule', validate(studentValidation.getSchedule), studentController.getStudentSchedule);

// Get student attendance information
router.get('/:studentId/attendance', validate(studentValidation.getStudentAttendance), studentController.getStudentAttendance);

module.exports = router