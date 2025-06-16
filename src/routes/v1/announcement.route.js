const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { announcementValidation } = require('../../validations');
const { announcementController } = require('../../controllers');
const { uploadSingle } = require('../../middlewares/upload');

const router = express.Router();

router
    .route('/')
    .post(auth('manageAnnouncements'), uploadSingle, announcementController.createAnnouncement)
    .get(auth(), announcementController.getAnnouncements);

router
    .route('/:announcementId')
    .get(announcementController.getAnnouncement)
    .patch(auth('manageAnnouncements'), announcementController.updateAnnouncement)
    .delete(auth('manageAnnouncements'), announcementController.deleteAnnouncement);

module.exports = router;
