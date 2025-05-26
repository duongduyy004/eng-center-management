const express = require('express')
const auth = require('../../middlewares/auth')
const { studentController } = require('../../controllers')
const router = express.Router()

router.route('/')
    .post(auth('manageStudents'), studentController.createStudent)
    .get(auth('getStudents'), studentController.getStudents)
router.route('/:studentId')
    .get(auth('manageStudents'), studentController.getStudent)
    .put(auth('manageStudents'), studentController.updateStudent)
    .delete(auth('manageStudents'), studentController.deleteStudent)

module.exports = router