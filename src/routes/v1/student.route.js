const express = require('express')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { studentController } = require('../../controllers')
const { studentValidation } = require('../../validations')
const router = express.Router()

router.route('/')
    .post(auth('manageStudents'), studentController.createStudent)
    .get(auth('getStudents'), studentController.getStudents)

router.get('/monthly-changes', auth('getStudents'), studentController.getMonthlyStudentChanges);

router.route('/:studentId')
    .get(auth('manageStudents'), studentController.getStudent)
    .patch(auth('manageStudents'), studentController.updateStudent)
    .delete(auth('manageStudents'), studentController.deleteStudent)

// Get student schedule
router.get('/:studentId/schedule', auth('getStudents'), studentController.getStudentSchedule
);

// Get student attendance information
router.get('/:studentId/attendance', auth('getStudents'), studentController.getStudentAttendance
);

module.exports = router