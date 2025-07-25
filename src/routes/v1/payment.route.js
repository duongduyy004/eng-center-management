const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

router
    .route('/')
    .get(auth('getPayments'), validate(paymentValidation.getPayments), paymentController.getPayments);

router.route('/total')
    .get(auth('getPayments'), paymentController.getTotalPayment)

router.route('/:paymentId/record')
    .patch(auth('managePayments'), validate(paymentValidation.recordPayment), paymentController.recordPayment)

router.route('/ipn')
    .get(paymentController.verifyIPN)
router
    .route('/:paymentId/reminder')
    .post(auth('managePayments'), validate(paymentValidation.sendPaymentReminder), paymentController.sendPaymentReminder);


module.exports = router;
