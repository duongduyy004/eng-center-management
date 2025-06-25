const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { teacherController } = require('../../controllers');
const { teacherValidation } = require('../../validations');

const router = express.Router();

router
    .route('/')
    .post(auth('manageTeachers'), validate(teacherValidation.createTeacher), teacherController.createTeacher)
    .get(auth('getTeachers'), validate(teacherValidation.getTeachers), teacherController.getTeachers);

router
    .route('/:teacherId')
    .get(auth('getTeachers'), validate(teacherValidation.getTeacher), teacherController.getTeacher)
    .patch(auth('manageTeachers'), validate(teacherValidation.updateTeacher), teacherController.updateTeacher)
    .delete(auth('manageTeachers'), validate(teacherValidation.deleteTeacher), teacherController.deleteTeacher);

router.get('/:teacherId/schedule', validate(teacherValidation.getTeacherSchedule), teacherController.getTeacherSchedule)
module.exports = router;
