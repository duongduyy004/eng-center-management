const httpStatus = require("http-status");
const { userService, classService } = require(".");
const { Student } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * 
 * @param {Object} studentBody 
 * @param {Object} studentBody.userData
 * @param {Object} studentBody.studentData
 * @returns 
 */

const createStudent = async (studentBody) => {
    const { userData, studentData } = studentBody
    //create user for student
    const user = await userService.createUser(userData)

    return await Student.create({ ...studentData, userId: user.id })
}

const queryStudents = async (filter, options) => {
    const users = await Student.paginate(filter, options);
    return users;
};

const getStudentById = async (studentId, populate) => {
    const student = await Student.findById(studentId).populate(populate)
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found')
    }
    return student
}

/**
 * @param {import("mongoose").ObjectId} studentId 
 * @param {Object} updateBody
 * @param {Object} [updateBody.userData]
 * @param {Object} [updateBody.studentData]
 */
const updateStudentById = async (studentId, updateBody) => {
    const student = await getStudentById(studentId)
    await userService.updateUserById(student.userId, updateBody.userData)
    Object.assign(student, updateBody.studentData)
    if (updateBody.studentData.classId) {
        const newClass = await classService.getClassById(updateBody.studentData.classId)
        newClass.studentIds.push(student.id)
    }
    await student.save()
    return student
}

const deleteStudentById = async (studentId) => {
    const student = await getStudentById(studentId);
    await student.remove();
    return student;
};

const getStudentClasses = async (studentId) => {
    const student = await Student.findById(studentId).populate('classId');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }
    return student.classId ? [student.classId] : [];
};

const getStudentAttendance = async (studentId, filter, options) => {
    const { Attendance } = require('../models');
    const attendanceFilter = { studentId, ...filter };
    const attendance = await Attendance.paginate(attendanceFilter, options);
    return attendance;
};

const getStudentPayments = async (studentId, filter, options) => {
    const { Payment } = require('../models');
    const paymentFilter = { studentId, ...filter };
    const payments = await Payment.paginate(paymentFilter, options);
    return payments;
};

const getStudentSchedule = async (studentId) => {
    const student = await Student.findById(studentId).populate({
        path: 'classId',
        populate: {
            path: 'schedule teacherId',
            select: 'name schedule'
        }
    });
    if (!student || !student.classId) {
        return { schedule: [] };
    }
    return {
        class: student.classId.name,
        schedule: student.classId.schedule || [],
        teacher: student.classId.teacherId?.name || 'Not assigned'
    };
};

const getStudentProgress = async (studentId) => {
    const { Attendance, Payment } = require('../models');
    const student = await Student.findById(studentId).populate('classId userId');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Get attendance data
    const totalClasses = await Attendance.countDocuments({ studentId });
    const presentClasses = await Attendance.countDocuments({ studentId, status: 'present' });

    // Get payment data
    const totalPayments = await Payment.countDocuments({ studentId });
    const paidPayments = await Payment.countDocuments({ studentId, status: 'paid' });

    return {
        student: {
            id: student._id,
            name: student.userId?.name,
            class: student.classId?.name
        },
        attendance: {
            total: totalClasses,
            present: presentClasses,
            rate: totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0
        },
        payments: {
            total: totalPayments,
            paid: paidPayments,
            rate: totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0
        }
    };
};

const getStudentStatistics = async (studentId) => {
    const { Attendance, Payment, Enrollment } = require('../models');
    const student = await Student.findById(studentId).populate('classId userId');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Monthly attendance
    const monthlyAttendance = await Attendance.countDocuments({
        studentId,
        date: {
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lt: new Date(currentYear, currentMonth, 1)
        }
    });

    // Total enrollments
    const totalEnrollments = await Enrollment.countDocuments({ studentId });

    return {
        student: {
            id: student._id,
            name: student.userId?.name,
            class: student.classId?.name
        },
        statistics: {
            monthlyAttendance,
            totalEnrollments,
            discountPercentage: student.discountPercentage || 0,
            joinDate: student.createdAt
        }
    };
};

const getStudentAnnouncements = async (studentId) => {
    const { Announcement } = require('../models');
    const student = await Student.findById(studentId).populate('classId');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Get announcements for student's class or general announcements
    const announcements = await Announcement.find({
        $or: [
            { targetAudience: 'all' },
            { targetAudience: 'students' },
            { classId: student.classId?._id }
        ],
        isActive: true
    }).sort({ createdAt: -1 });

    return announcements;
};

const enrollStudent = async (studentId, enrollmentData) => {
    const { Enrollment } = require('../models');
    const student = await getStudentById(studentId);

    const enrollment = await Enrollment.create({
        studentId,
        classId: enrollmentData.classId,
        enrollmentDate: enrollmentData.enrollmentDate || new Date(),
        status: enrollmentData.status || 'active'
    });

    // Update student's classId if enrollment is active
    if (enrollment.status === 'active') {
        student.classId = enrollmentData.classId;
        await student.save();
    }

    return enrollment;
};

module.exports = {
    createStudent,
    queryStudents,
    getStudentById,
    updateStudentById,
    deleteStudentById,
    getStudentClasses,
    getStudentAttendance,
    getStudentPayments,
    getStudentSchedule,
    getStudentProgress,
    getStudentStatistics,
    getStudentAnnouncements,
    enrollStudent
}