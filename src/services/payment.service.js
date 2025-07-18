const httpStatus = require('http-status');
const { Payment, Student, Class, Attendance } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const vnpayService = require('./vnpay.service');
const { default: mongoose } = require('mongoose');

const getTotalPayment = async () => {

    const result = await Payment.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: '$finalAmount' },
                paid: { $sum: '$paidAmount' }
            }
        }
    ]);
    return result.length > 0 ? {
        total: result[0].total,
        paid: result[0].paid
    } : 0;
};

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
    if (filter.startMonth && filter.endMonth) {
        Object.assign(filter, {
            month: {
                $gte: parseInt(filter.startMonth),
                $lte: parseInt(filter.endMonth)
            }
        })
        delete filter.startMonth;
        delete filter.endMonth
    }
    const payments = await Payment.paginate(filter, {
        ...options, populate: [
            { path: 'studentId', populate: { path: 'userId', select: 'name' }, select: 'userId' },
            { path: 'classId', select: 'name year' }
        ]
    });
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
    const payment = await getPaymentById(paymentId);
    let { amount, method = 'cash', note = `Thanh toán học phí tháng ${payment.month}/${payment.year}` } = paymentData;

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

    if (note === '') note = `Thanh toán học phí tháng ${payment.month}/${payment.year}`

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

const redirectVNPay = async (paymentData) => {
    const payment = await getPaymentById(paymentData.paymentId);
    return vnpayService.createPaymentURL(paymentData.paymentId, {
        ...paymentData,
        month: payment.month,
        year: payment.year
    })
}

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

/**
 * Auto update/create payment records when attendance is updated
 * @param {Object} attendance - Attendance document (should be converted to plain object)
 */
const autoUpdatePaymentRecords = async (attendance) => {
    try {

        // Convert Mongoose document to plain object to avoid internal properties
        const attendanceData = attendance.toObject ? attendance.toObject() : attendance;

        const attendanceDate = new Date(attendanceData.date);
        const month = attendanceDate.getMonth() + 1;
        const year = attendanceDate.getFullYear();

        // Get class info with fee details
        const classInfo = await Class.findById(attendanceData.classId);
        if (!classInfo || !classInfo.feePerLesson) {
            logger.warn('Class fee information not found, skipping payment update');
            return;
        }

        // Process each student in the attendance
        for (const studentAttendance of attendanceData.students) {
            const studentId = studentAttendance.studentId;

            // Get student's enrollment info for this class
            const student = await Student.findById(studentId);
            if (!student) continue;

            const classEnrollment = student.classes.find(
                c => c.classId.toString() === attendanceData.classId.toString() && c.status === 'active'
            );

            if (!classEnrollment) continue;

            // Check if payment record exists for this month/year
            let paymentRecord = await Payment.findOne({
                studentId: studentId,
                classId: attendanceData.classId,
                month: month,
                year: year
            });

            // Count total attendance sessions for this month
            const monthlyAttendance = await Attendance.find({
                classId: attendanceData.classId,
                date: {
                    $gte: new Date(year, month - 1, 1),
                    $lt: new Date(year, month, 1)
                }
            });
            // Count attended sessions for this student
            let attendedLessons = 0;
            monthlyAttendance.forEach(att => {
                const studentRecord = att.students.find(s => s.studentId.toString() === studentId.toString());
                if (studentRecord && (studentRecord.status === 'present' || studentRecord.status === 'late')) {
                    attendedLessons++;
                }
            });

            const discountPercent = classEnrollment.discountPercent || 0;
            const feePerLesson = classInfo.feePerLesson;
            const totalLessons = monthlyAttendance.length;

            if (paymentRecord) {
                // Update existing payment record
                paymentRecord.totalLessons = totalLessons;
                paymentRecord.attendedLessons = attendedLessons;
                paymentRecord.feePerLesson = feePerLesson;
                paymentRecord.discountPercent = discountPercent;

                await paymentRecord.save();
                logger.info(`Updated payment record for student ${studentId}, month ${month}/${year}`);
            } else if (attendedLessons > 0) {
                // Create new payment record
                const newPayment = new Payment({
                    studentId: studentId,
                    classId: attendanceData.classId,
                    month: month,
                    year: year,
                    totalLessons: totalLessons,
                    attendedLessons: attendedLessons,
                    feePerLesson: feePerLesson,
                    discountPercent: discountPercent,
                    status: 'pending',
                });

                await newPayment.save();
                logger.info(`Created payment record for student ${studentId}, month ${month}/${year}`);
            }
        }
    } catch (error) {
        logger.error('Error updating payment records:', error);
    }
};

module.exports = {
    queryPayments,
    getPaymentById,
    recordPayment,
    sendPaymentReminder,
    autoUpdatePaymentRecords,
    getTotalPayment,
    redirectVNPay
};