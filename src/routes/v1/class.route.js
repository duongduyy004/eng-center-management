const express = require('express')
const router = express.Router()
const validate = require('../../middlewares/validate');
const classController = require('../../controllers/class.controller');
const auth = require('../../middlewares/auth');

router
  .route('/')
  .get(auth('getClasses'), classController.getClasses)
  .post(auth('manageClasses'), classController.createClass)

router.route('/:classId')
  .get(auth('getClasses'), classController.getClass)
  .patch(auth('manageClasses'), classController.updateClass)

// Enroll student to class
router.post('/:classId/enroll',
  auth('manageClasses'),
  classController.enrollStudentToClass
);

// Remove student from class
router.delete('/:classId/students/:studentId',
  auth('manageClasses'),
  classController.removeStudentFromClass
);

// Transfer student between classes
router.post('/transfer',
  auth('manageClasses'),
  classController.transferStudent
);

// Get class enrollment history
router.get('/:classId/enrollment-history',
  auth('getClasses'),
  classController.getClassEnrollmentHistory
);

module.exports = router;