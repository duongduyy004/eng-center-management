const httpStatus = require('http-status');
const { TeacherPayment, Class, Attendance, Teacher } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create or update teacher payment when attendance is marked
 * @param {Object} attendanceData - Attendance record data
 * @returns {Promise<void>}
 */
const autoUpdateTeacherPayment = async (attendanceData) => {
    try {
        const { classId, date } = attendanceData;
        // Get class information
        const classInfo = await Class.findById(classId).populate('teacherId');
        if (!classInfo || !classInfo.teacherId) {
            logger.warn('Class or teacher not found for attendance update');
            return;
        }

        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const teacherId = classInfo.teacherId._id;
        const teacher = await Teacher.findById(teacherId)

        // Check if teacher payment record exists for this month/year/class
        let teacherPayment = await TeacherPayment.findOne({
            teacherId,
            month,
            year
        });

        // Get all attendance records for this class in this month
        const attendanceRecords = await Attendance.find({
            classId,
            date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        });

        const completedLessons = attendanceRecords.length;
        const salaryPerLesson = teacher.salaryPerLesson || 0;

        if (teacherPayment) {
            // Update existing payment record
            teacherPayment.salaryPerLesson = salaryPerLesson;
            let classFound = false
            for (const item of teacherPayment.classes) {
                if (item.classId.toString() === classId.toString()) {
                    item.totalLessons = completedLessons
                    classFound = true;
                    break;
                }
            }
            if (!classFound) {
                teacherPayment.classes.push({
                    classId,
                    totalLessons: completedLessons
                })
            }
            await teacherPayment.save();
            logger.info(`Updated teacher payment for teacher ${teacherId}, class ${classId}, month ${month}/${year}`);
        } else {
            // Create new payment record
            const newPayment = new TeacherPayment({
                teacherId,
                month,
                year,
                salaryPerLesson
            });
            newPayment.classes.push({
                classId,
                totalLessons: completedLessons
            })
            await newPayment.save();
            logger.info(`Created teacher payment for teacher ${teacherId}, class ${classId}, month ${month}/${year}`);
        }

    } catch (error) {
        logger.error('Error auto-updating teacher payment:', error);
        throw error;
    }
};


/**
 * Query for teacher payments
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTeacherPayments = async (filter, options) => {
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
    const teacherPayments = await TeacherPayment.paginate(filter, {
        ...options, populate: [
            { path: 'classes', populate: { path: 'classId', select: 'name year' } },
            { path: 'teacherId', select: 'userId', populate: { path: 'userId', select: 'name' } }
        ]
    })
    return teacherPayments;
};

/**
 * Get teacher payment by id
 * @param {ObjectId} id
 * @returns {Promise<TeacherPayment>}
 */
const getTeacherPaymentByTeacherId = async (teacherId) => {
    const teacherPayment = await TeacherPayment.findOne({ teacherId })
        .populate([
            { path: 'teacherId', populate: { path: 'userId', select: 'name email phone' }, select: 'teacherId' },
            { path: 'classes', populate: { path: 'classId', select: 'name year' } }
        ]);

    if (!teacherPayment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher payment not found');
    }
    return teacherPayment;
};

/**
 * Get teacher payment statistics
 * @param {Object} filter
 * @returns {Promise<Object>}
 */
const getTeacherPaymentStatistics = async (filter = {}) => {
    const payments = await TeacherPayment.find(filter);

    const stats = {
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        paidPayments: payments.filter(p => p.status === 'paid').length,
        totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
        paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0),
        pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalAmount, 0)
    };

    return stats;
};

/**
 * Record teacher payment - Bulk update version
 * @param {ObjectId} teacherId
 * @param {Object} paymentData
 * @returns {Promise<TeacherPayment[]>}
 */
const recordTeacherPayment = async (teacherId, paymentData) => {
    const teacherPayments = await getTeacherPaymentByTeacherId(teacherId);

    if (teacherPayments.status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment was fully paid');
    }

    // Validate payment amount
    if (paymentData.amount > (teacherPayments.totalAmount - teacherPayments.paidAmount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Amount must be less than or equal to total amount: ${total}`);
    }

    teacherPayments.paidAmount = paymentData.amount
    teacherPayments.paymentHistory.push({
        amount: paymentData.amount,
        date: new Date(),
        method: paymentData.method,
        note: paymentData.note
    })
    await teacherPayments.save()
    logger.info(`Teacher payment of ${teacherId} recorded as paid. `);
    return teacherPayments
};

module.exports = {
    autoUpdateTeacherPayment,
    queryTeacherPayments,
    getTeacherPaymentByTeacherId,
    getTeacherPaymentStatistics,
    recordTeacherPayment,
};
