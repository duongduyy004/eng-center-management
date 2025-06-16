const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const teacherPaymentValidation = require('../../validations/teacherPayment.validation');
const teacherPaymentController = require('../../controllers/teacherPayment.controller');

const router = express.Router();

router
    .route('/')
    .get(auth('getTeacherPayments'), teacherPaymentController.getTeacherPayments);

router
    .route('/statistics')
    .get(auth('getTeacherPayments'), validate(teacherPaymentValidation.getTeacherPaymentStatistics), teacherPaymentController.getTeacherPaymentStatistics);


router
    .route('/:teacherPaymentId')
    .get(auth('getTeacherPayments'), validate(teacherPaymentValidation.getTeacherPayment), teacherPaymentController.getTeacherPayment)

router
    .route('/:teacherPaymentId/pay')
    .post(auth('manageTeacherPayments'), validate(teacherPaymentValidation.recordTeacherPayment), teacherPaymentController.recordTeacherPayment);


module.exports = router;
