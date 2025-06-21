const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { announcementValidation } = require('../../validations');
const { announcementController } = require('../../controllers');
const { uploadBanner } = require('../../middlewares/upload');

const router = express.Router();

router
    .route('/')
    .post(auth('manageAnnouncements'), uploadBanner, validate(announcementValidation.createAnnouncement), announcementController.createAnnouncement)
    .get(auth(), announcementController.getAnnouncements);

router
    .route('/:announcementId')
    .get(announcementController.getAnnouncement)
    .patch(auth('manageAnnouncements'), uploadBanner, validate(announcementValidation.updateAnnouncement), announcementController.updateAnnouncement)
    .delete(auth('manageAnnouncements'), validate(announcementValidation.deleteAnnouncement), announcementController.deleteAnnouncement);

module.exports = router;
