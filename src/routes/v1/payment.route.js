const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

router
    .route('/')
    .post(auth('managePayments'), validate(paymentValidation.createPayment), paymentController.createPayment)
    .get(auth('getPayments'), validate(paymentValidation.getPayments), paymentController.getPayments);

router
    .route('/statistics')
    .get(auth('getPayments'), validate(paymentValidation.getPaymentStatistics), paymentController.getPaymentStatistics);

router
    .route('/overdue')
    .get(auth('getPayments'), validate(paymentValidation.getOverduePayments), paymentController.getOverduePayments);

router
    .route('/student/:studentId')
    .get(auth('getPayments'), validate(paymentValidation.getPaymentsByStudent), paymentController.getPaymentsByStudent);

router
    .route('/class/:classId')
    .get(auth('getPayments'), validate(paymentValidation.getPaymentsByClass), paymentController.getPaymentsByClass);

router
    .route('/report/:month/:year')
    .get(auth('getPayments'), validate(paymentValidation.getMonthlyPaymentReport), paymentController.getMonthlyPaymentReport);

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

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a payment
 *     description: Only admins and teachers can create payments.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - classId
 *               - month
 *               - year
 *               - totalLessons
 *               - feePerLesson
 *             properties:
 *               studentId:
 *                 type: string
 *               classId:
 *                 type: string
 *               month:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *               year:
 *                 type: number
 *               totalLessons:
 *                 type: number
 *               feePerLesson:
 *                 type: number
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               attendedLessons:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Payment'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: Get all payments
 *     description: Only admins and teachers can retrieve all payments.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Student id
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Class id
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Month
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, partial, paid, overdue]
 *         description: Payment status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of payments
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a payment
 *     description: Only admins and teachers can fetch payments.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Payment'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
