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
  .put(auth('manageClasses'), classController.updateClass)

module.exports = router;