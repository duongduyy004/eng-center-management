const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { parentController } = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .post(auth('manageParents'), parentController.createParent)
    .get(auth('getParents'), parentController.getParents)
    .patch(auth('manageParents'), parentController.addChild)
    .delete(auth('manageParents'), parentController.deleteChild)

router
    .route('/pay-tuition')
    .patch(auth('payTuition'), parentController.payTuition)

router
    .route('/:parentId')
    .get(auth('getParents'), parentController.getParent)
    .patch(auth('manageParents'), parentController.updateParent)
    .delete(auth('manageParents'), parentController.deleteParent);

module.exports = router;
