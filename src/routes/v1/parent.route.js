const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { parentController } = require('../../controllers');
const { parentValidation } = require('../../validations');

const router = express.Router();

router
    .route('/')
    .post(auth('manageParents'), validate(parentValidation.createParent), parentController.createParent)
    .get(auth('getParents'), validate(parentValidation.getParents), parentController.getParents)
    .patch(auth('manageParents'), validate(parentValidation.addChild), parentController.addChild)
    .delete(auth('manageParents'), validate(parentValidation.deleteChild), parentController.deleteChild)

router
    .route('/pay-tuition')
    .patch(validate(parentValidation.payTuition), parentController.payTuition)

router
    .route('/:parentId')
    .get(auth('getParents'), validate(parentValidation.getParent), parentController.getParent)
    .patch(auth('manageParents'), validate(parentValidation.updateParent), parentController.updateParent)
    .delete(auth('manageParents'), validate(parentValidation.deleteParent), parentController.deleteParent);

module.exports = router;
