const httpStatus = require('http-status');
const { Payment } = require('../models');
const ApiError = require('../utils/ApiError');

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
    return Payment.findById(id).populate('studentId classId', 'name');
};

/**
 * Create a payment
 * @param {Object} paymentBody
 * @returns {Promise<Payment>}
 */
const createPayment = async (paymentBody) => {
    const {
        studentId,
        classId,
        month,
        year,
        totalLessons,
        feePerLesson,
        discountPercent = 0,
        attendedLessons = 0,
        notes = ''
    } = paymentBody;

    // Check if payment already exists for this student, class, month, and year
    const existingPayment = await Payment.findOne({
        studentId,
        classId,
        month,
        year
    });

    if (existingPayment) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment record already exists for this month');
    }

    // Create payment record
    const payment = Payment({
        studentId,
        classId,
        month,
        year,
        totalLessons,
        attendedLessons,
        feePerLesson,
        discountPercent,
        notes,
        // The following fields will be calculated automatically by the model's pre-save middleware:
        // totalAmount, discountAmount, finalAmount, remainingAmount, status
    });

    await payment.save();

    console.log('Payment created with middleware calculations:', {
        totalAmount: payment.totalAmount,
        discountAmount: payment.discountAmount,
        finalAmount: payment.finalAmount,
        status: payment.status
    });

    return payment;
};

/**
 * Update payment by id
 * @param {ObjectId} paymentId
 * @param {Object} updateBody
 * @returns {Promise<Payment>}
 */
const updatePaymentById = async (paymentId, updateBody) => {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }
    Object.assign(payment, updateBody);
    await payment.save();
    return payment;
};

/**
 * Delete payment by id
 * @param {ObjectId} paymentId
 * @returns {Promise<Payment>}
 */
const deletePaymentById = async (paymentId) => {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }
    await payment.remove();
    return payment;
};

/**
 * Record a payment
 * @param {ObjectId} paymentId
 * @param {Object} paymentData
 * @returns {Promise<Payment>}
 */
const recordPayment = async (paymentId, paymentData) => {
    const { amount, method = 'cash', note = '', receivedBy } = paymentData;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (payment.status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment is already fully paid');
    }

    // Check if payment amount is valid
    if (amount <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount must be greater than 0');
    }

    if (payment.paidAmount + amount > payment.finalAmount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount exceeds remaining balance');
    }

    // Add to payment history
    payment.paymentHistory.push({
        amount,
        date: new Date(),
        method,
        note,
        receivedBy
    });

    // Update paid amount
    payment.paidAmount += amount;
    payment.paymentDate = new Date();

    await payment.save();
    return payment;
};

/**
 * Get payment statistics
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Object>}
 */
const getPaymentStatistics = async (filter = {}) => {
    const totalPayments = await Payment.countDocuments(filter);
    const paidPayments = await Payment.countDocuments({ ...filter, status: 'paid' });
    const pendingPayments = await Payment.countDocuments({ ...filter, status: 'pending' });
    const partialPayments = await Payment.countDocuments({ ...filter, status: 'partial' });
    const overduePayments = await Payment.countDocuments({ ...filter, status: 'overdue' });

    // Calculate total amounts
    const totalAmountResult = await Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    const paidAmountResult = await Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    const totalAmount = totalAmountResult[0]?.total || 0;
    const paidAmount = paidAmountResult[0]?.total || 0;
    const remainingAmount = totalAmount - paidAmount;

    return {
        counts: {
            total: totalPayments,
            paid: paidPayments,
            pending: pendingPayments,
            partial: partialPayments,
            overdue: overduePayments
        },
        amounts: {
            total: totalAmount,
            paid: paidAmount,
            remaining: remainingAmount,
            collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
        }
    };
};

/**
 * Get payments by student
 * @param {ObjectId} studentId
 * @param {Object} filter - Additional filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPaymentsByStudent = async (studentId, filter = {}, options = {}) => {
    const paymentFilter = { studentId, ...filter };
    return queryPayments(paymentFilter, options);
};

/**
 * Get payments by class
 * @param {ObjectId} classId
 * @param {Object} filter - Additional filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPaymentsByClass = async (classId, filter = {}, options = {}) => {
    const paymentFilter = { classId, ...filter };
    return queryPayments(paymentFilter, options);
};

/**
 * Get monthly payment report
 * @param {number} month
 * @param {number} year
 * @returns {Promise<Object>}
 */
const getMonthlyPaymentReport = async (month, year) => {
    const filter = { month, year };
    const payments = await Payment.find(filter)
        .populate('studentId', 'name')
        .populate('classId', 'name grade section')
        .sort({ createdAt: -1 });

    const statistics = await getPaymentStatistics(filter);

    return {
        month,
        year,
        payments,
        statistics
    };
};

/**
 * Update payment status to overdue
 * @param {ObjectId} paymentId
 * @returns {Promise<Payment>}
 */
const markPaymentOverdue = async (paymentId) => {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (payment.status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot mark paid payment as overdue');
    }

    payment.status = 'overdue';
    await payment.save();
    return payment;
};

/**
 * Get overdue payments
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getOverduePayments = async (options = {}) => {
    const filter = { status: 'overdue' };
    return queryPayments(filter, options);
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
    console.log(`Payment reminder sent for payment ID: ${paymentId}`);

    return {
        message: 'Payment reminder sent successfully',
        paymentId
    };
};

module.exports = {
    queryPayments,
    getPaymentById,
    createPayment,
    updatePaymentById,
    deletePaymentById,
    recordPayment,
    getPaymentStatistics,
    getPaymentsByStudent,
    getPaymentsByClass,
    getMonthlyPaymentReport,
    markPaymentOverdue,
    getOverduePayments,
    sendPaymentReminder
};