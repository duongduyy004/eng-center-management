const httpStatus = require("http-status");
const { Class, Student } = require("../models");
const ApiError = require("../utils/ApiError");

const queryClasses = async (filter, options) => {
    const aClass = await Class.paginate(filter, options);
    return aClass;
}

const isClassExist = async (grade, section, year) => {
    const aClass = await Class.findOne({ grade, section, year })
    return aClass
}

const getClassById = async (classId) => {
    const aClass = await Class.findById(classId)
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found')
    }
    return aClass;
}

/**
 * Create a class
 * @param {Object} classBody
 * @returns {Promise<Class>}
 */
const createClass = async (classBody) => {
    if (classBody && isClassExist(classBody?.grade, classBody?.section, classBody?.year) === null) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class already exsit')
    }
    return await Class.create(classBody)
};

const updateClass = async (classId, classUpdate) => {
    const { type } = classUpdate
    const aClass = await Class.findById(classId)
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found')
    }
    Object.assign(aClass, classUpdate)
    await aClass.save()
    return aClass
}

/**
 * Enroll student to a class
 * @param {ObjectId} classId
 * @param {ObjectId} studentData
 * @returns {Promise<Object>}
 */
const enrollStudentToClass = async (classId, studentData) => {

    // Check if class exists and is active
    const classInfo = await getClassById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    if (classInfo.status === 'closed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot enroll to a closed class');
    }

    // Check if class has available slots
    if (classInfo.currentStudents >= classInfo.maxStudents) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class is full');
    }

    // Check if student exists
    const student = await Student.findById(studentData.studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Check if student is already enrolled in this class
    const existingEnrollment = student.classes.find(
        c => {
            if (c.classId) {
                return c.classId.toString() === classId.toString() && c.status === 'active'
            }
        }
    );
    if (existingEnrollment) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student is already enrolled in this class');
    }

    // Add student to class
    const enrollmentInfo = {
        classId: classId,
        discountPercent: studentData.discountPercent || 0,
        enrollmentDate: new Date(),
        status: 'active'
    };

    await Student.findByIdAndUpdate(
        studentData.studentId,
        { $push: { classes: enrollmentInfo } },
        { new: true }
    );

    // Update class current students count
    await Class.findByIdAndUpdate(
        classId,
        { $inc: { currentStudents: 1 } }
    );

    // Create initial payment record for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    try {
        const paymentService = require('./payment.service');
        await paymentService.createPayment({
            studentId: studentData.studentId,
            classId: classId,
            month: currentMonth,
            year: currentYear,
            totalLessons: classInfo.totalLessons || 8, // Default 8 lessons per month
            feePerLesson: classInfo.feePerLesson,
            discountPercent: enrollmentInfo.discountPercent
        });
    } catch (error) {
        // Log error but don't fail enrollment
        console.error('Failed to create payment record:', error);
    }

    // Return updated student info
    const updatedStudent = await Student.findById(studentData.studentId)
        .populate('userId', 'name email phone')
        .populate('classes.classId', 'name grade section year');

    return {
        student: updatedStudent,
        enrollmentInfo,
        classInfo: {
            id: classInfo._id,
            name: classInfo.name,
            currentStudents: classInfo.currentStudents + 1,
            maxStudents: classInfo.maxStudents
        }
    };
};

/**
 * Remove student from a class
 * @param {ObjectId} classId
 * @param {ObjectId} studentId
 * @returns {Promise<Object>}
 */
const removeStudentFromClass = async (classId, studentId) => {

    // Check if class exists
    const classInfo = await getClassById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Find the enrollment
    const enrollmentIndex = student.classes.findIndex(
        c => c.classId.toString() === classId.toString() && c.status === 'active'
    );

    if (enrollmentIndex === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student is not enrolled in this class');
    }

    // Update enrollment status to inactive instead of removing
    await Student.findOneAndUpdate(
        { _id: studentId, 'classes.classId': classId },
        {
            $set: {
                'classes.$.status': 'inactive',
                'classes.$.withdrawalDate': new Date()
            }
        }
    );

    // Update class current students count
    await Class.findByIdAndUpdate(
        classId,
        { $inc: { currentStudents: -1 } }
    );

    // Update payment records - mark remaining payments as cancelled
    const { Payment } = require('../models');
    await Payment.updateMany(
        {
            studentId: studentId,
            classId: classId,
            status: { $in: ['pending', 'partial'] }
        },
        {
            status: 'cancelled',
            notes: 'Student withdrawn from class'
        }
    );

    return {
        message: 'Student removed from class successfully',
        classInfo: {
            id: classInfo._id,
            name: classInfo.name,
            currentStudents: Math.max(0, classInfo.currentStudents - 1),
            maxStudents: classInfo.maxStudents
        }
    };
};

/**
 * Transfer student to another class
 * @param {ObjectId} fromClassId
 * @param {ObjectId} toClassId
 * @param {ObjectId} studentId
 * @param {Object} transferData
 * @returns {Promise<Object>}
 */
const transferStudent = async (fromClassId, toClassId, studentId, transferData = {}) => {
    // Remove from old class
    await removeStudentFromClass(fromClassId, studentId);

    // Add to new class
    const result = await enrollStudentToClass(toClassId, studentId, transferData);

    return {
        ...result,
        message: 'Student transferred successfully',
        transfer: {
            from: fromClassId,
            to: toClassId,
            date: new Date(),
            reason: transferData.reason || 'Transfer requested'
        }
    };
};

module.exports = {
    queryClasses,
    createClass,
    updateClass,
    getClassById,
    enrollStudentToClass,
    removeStudentFromClass,
    transferStudent
}