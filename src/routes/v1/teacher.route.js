const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { teacherController } = require('../../controllers');
const { teacherValidation } = require('../../validations');

const router = express.Router();

router
    .route('/')
    .post(auth('manageTeachers'), teacherController.createTeacher)
    .get(auth('getTeachers'), teacherController.getTeachers);

router
    .route('/:teacherId')
    .get(auth('getTeachers'), teacherController.getTeacher)
    .patch(auth('manageTeachers'), teacherController.updateTeacher)
    .delete(auth('manageTeachers'), teacherController.deleteTeacher);

module.exports = router;
