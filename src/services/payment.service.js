const httpStatus = require('http-status');
const { Payment, Student } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Query for payments
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPayments = async (filter, options) => {
    const payments = await Payment.paginate(filter, options);
    return payments;
};

/**
 * Get payment by id
 * @param {ObjectId} id
 * @returns {Promise<Payment>}
 */
const getPaymentById = async (id) => {
    const payment = await Payment.findById(id).populate('studentId classId', 'name');
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }
    return payment
};

/**
 * Record a payment
 * @param {ObjectId} paymentId
 * @param {Object} paymentData
 * @returns {Promise<Payment>}
 */
const recordPayment = async (paymentId, paymentData) => {
    const { amount, method = 'cash', note = '' } = paymentData;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    const student = await Student.findById(payment.studentId.parentId)

    if (payment.status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment is already fully paid');
    }

    // Check if payment amount is valid
    if (amount <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount must be greater than 0');
    }

    if (payment.paidAmount + +amount > payment.finalAmount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount exceeds remaining balance');
    }

    // Add to payment history
    payment.paymentHistory.push({
        amount,
        date: new Date(),
        method,
        note,
    });

    // Update paid amount
    payment.paidAmount += +amount;
    payment.paymentDate = new Date();

    await payment.save();
    return payment;
};

/**
 * Send payment reminders (placeholder for future implementation)
 * @param {ObjectId} paymentId
 * @returns {Promise<Object>}
 */
const sendPaymentReminder = async (paymentId) => {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // TODO: Implement email/SMS notification logic
    logger.info(`Payment reminder sent for payment ID: ${paymentId}`);

    return {
        message: 'Payment reminder sent successfully',
        paymentId
    };
};

module.exports = {
    queryPayments,
    getPaymentById,
    recordPayment,
    sendPaymentReminder
};