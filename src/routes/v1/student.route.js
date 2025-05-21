const express = require('express')
const auth = require('../../middlewares/auth')
const { studentController } = require('../../controllers')
const router = express.Router()

router.route('/')
    .post(auth('manageStudents'), studentController.createStudent)
    .get(auth('getStudents'), studentController.getStudents)
router.route('/:userId')
    .get(auth('manageStudents'), studentController.getStudent)
module.exports = router