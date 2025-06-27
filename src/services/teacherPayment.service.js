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
            classId,
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
            teacherPayment.totalLessons = completedLessons;
            teacherPayment.salaryPerLesson = salaryPerLesson;
            await teacherPayment.save();
            logger.info(`Updated teacher payment for teacher ${teacherId}, class ${classId}, month ${month}/${year}`);
        } else {
            // Create new payment record
            const newPayment = new TeacherPayment({
                teacherId,
                classId,
                month,
                year,
                totalLessons: completedLessons,
                salaryPerLesson
            });
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
    const teacherPayments = await TeacherPayment.paginate(filter, {
        ...options, populate: [
            { path: 'classId', select: 'schedule name grade section year' },
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
const getTeacherPaymentById = async (id) => {
    const teacherPayment = await TeacherPayment.findById(id)
        .populate([
            { path: 'teacherId', populate: { path: 'userId', select: 'name email phone' } },
            { path: 'classId', select: 'name level schedule' }
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
 * Record teacher payment
 * @param {ObjectId} teacherPaymentId
 * @param {Object} paymentData
 * @returns {Promise<TeacherPayment>}
 */
const recordTeacherPayment = async (teacherPaymentId, paymentData) => {
    const teacherPayment = await getTeacherPaymentById(teacherPaymentId);

    teacherPayment.status = 'paid';
    teacherPayment.paymentDate = new Date();
    teacherPayment.paymentHistory = {
        amount: paymentData.amount || teacherPayment.totalAmount,
        date: new Date(),
        method: paymentData.method || 'cash',
        note: paymentData.note || ''
    };

    if (paymentData.notes) {
        teacherPayment.notes = paymentData.notes;
    }

    await teacherPayment.save();
    logger.info(`Teacher payment ${teacherPaymentId} recorded as paid`);
    return teacherPayment;
};

module.exports = {
    autoUpdateTeacherPayment,
    queryTeacherPayments,
    getTeacherPaymentById,
    getTeacherPaymentStatistics,
    recordTeacherPayment,
};
