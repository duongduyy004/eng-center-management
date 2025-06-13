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

const getStudentById = async (studentId) => {
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

module.exports = {
    createStudent,
    queryStudents,
    getStudentById,
    updateStudentById,
    deleteStudentById,
    getStudentClasses,
    getStudentAttendance,
    getStudentPayments,
    getStudentSchedule
}