const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

router
    .route('/')
    .get(auth('getPayments'), paymentController.getPayments);

router
    .route('/statistics')
    .get(auth('getPayments'), validate(paymentValidation.getPaymentStatistics), paymentController.getPaymentStatistics);

router
    .route('/overdue')
    .get(auth('getPayments'), validate(paymentValidation.getOverduePayments), paymentController.getOverduePayments);

router
    .route('/:paymentId')
    .get(auth('getPayments'), validate(paymentValidation.getPayment), paymentController.getPayment)
    .patch(auth('managePayments'), validate(paymentValidation.updatePayment), paymentController.updatePayment)
    .delete(auth('managePayments'), validate(paymentValidation.deletePayment), paymentController.deletePayment);

router
    .route('/:paymentId/record')
    .post(auth('managePayments'), validate(paymentValidation.recordPayment), paymentController.recordPayment);

router
    .route('/:paymentId/overdue')
    .patch(auth('managePayments'), validate(paymentValidation.markPaymentOverdue), paymentController.markPaymentOverdue);

router
    .route('/:paymentId/reminder')
    .post(auth('managePayments'), validate(paymentValidation.sendPaymentReminder), paymentController.sendPaymentReminder);

module.exports = router;
