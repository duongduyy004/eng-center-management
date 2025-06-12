const httpStatus = require("http-status");
const { userService, classService } = require(".");
const { Student, User } = require("../models");
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
    if (studentData.classes && !studentData.classes.classId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please pick a class')
    }

    const user = await userService.createUser({ ...userData, role: 'student' })

    return await Student.create({ ...studentData, userId: user.id })
}

const queryStudents = async (filter, options) => {
    if (filter.name) {
        const users = await User.find({
            name: { $regex: filter.name, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        filter.userId = { $in: userIds };
        delete filter.name;
    }
    const users = await Student.paginate(filter, { ...options, populate: 'userId' })
    return users;
};

const getStudentById = async (studentId, populate) => {
    const student = await Student.findById(studentId).populate('userId')
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
const updateStudentById = async (studentId, updateBody, user) => {
    const { userData, studentData } = updateBody
    const student = await getStudentById(studentId)
    if (user.role !== 'admin') {
        delete userData.name;
        delete studentData;
    }
    await userService.updateUserById(student.userId, { ...userData, role: 'student' })

    if (studentData.length > 0) {
        student.classes = studentData;
    }
    await student.save()

    return student
}

const deleteStudentById = async (studentId) => {
    const student = await getStudentById(studentId);
    await userService.deleteUserById(student.userId)
    await student.delete();
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
    getStudentAnnouncements
}