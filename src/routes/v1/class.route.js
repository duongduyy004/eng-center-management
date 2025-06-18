const express = require('express')
const router = express.Router()
const validate = require('../../middlewares/validate');
const classValidation = require('../../validations/class.validation');
const classController = require('../../controllers/class.controller');
const auth = require('../../middlewares/auth');

router
  .route('/')
  .get(auth('getClasses'), validate(classValidation.getClasses), classController.getClasses)
  .post(auth('manageClasses'), validate(classValidation.createClass), classController.createClass)

router.route('/:classId')
  .get(auth('getClasses'), validate(classValidation.getClass), classController.getClass)
  .patch(auth('manageClasses'), validate(classValidation.updateClass), classController.updateClass)

router.route('/:classId/students')
  .get(auth('getClasses'), validate(classValidation.getClassStudents), classController.getClassStudents)
  .patch(auth('manageClasses'), validate(classValidation.enrollStudent), classController.enrollStudentToClass)
  .delete(auth('manageClasses'), validate(classValidation.removeStudentFromClass), classController.removeStudentFromClass)

// Assign teacher to class
router.route('/:classId/teacher')
  .patch(auth('manageTeachers'), validate(classValidation.assignTeacherToClass), classController.assignTeacherToClass)
  .delete(auth('manageTeachers'), validate(classValidation.unassignTeacherFromClass), classController.unassignTeacherFromClass);

module.exports = router;