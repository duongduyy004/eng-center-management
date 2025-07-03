const httpStatus = require("http-status");
const mongoose = require("mongoose");
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
    const { email, password, name, dayOfBirth, phone, address, gender } = studentBody
    userData = { email, password, name, dayOfBirth, phone, address, gender }
    //create user for student
    const user = await userService.createUser({ ...userData, role: 'student' })

    const student = await Student.create({ userId: user.id })

    return await student.populate('userId')
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
    if (filter.email) {
        const users = await User.find({
            email: { $regex: filter.email, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        filter.userId = { $in: userIds };
        delete filter.email;
    }
    const students = await Student.paginate(filter, {
        ...options, populate: [
            { path: 'userId' },
            { path: 'parentId', populate: { path: 'userId', select: 'name email' }, select: 'userId' },
            { path: 'classes.classId', select: 'name grade section' }
        ]
    })
    return students;
};

const getStudentById = async (studentId) => {
    const student = await Student.findById(studentId)
        .populate('userId')
        .populate('parentId', 'userId')
        .populate({
            path: 'classes.classId',
            select: 'name grade section year room status schedule teacherId',
            populate: {
                path: 'teacherId',
                select: 'userId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            }
        });
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
    if (user.role !== 'admin' && studentData) {
        delete studentData;
    }
    await userService.updateUserById(student.userId, { ...userData, role: 'student' })

    if (studentData && studentData.length > 0) {
        for (const oldItem of student.classes) {
            studentData.map(newItem => {
                if (oldItem.classId.id == newItem.classId) {
                    newItem.discountPercent && oldItem.$set('discountPercent', newItem.discountPercent);
                    newItem.status && oldItem.$set('status', newItem.status);
                }
            })
        }
    }
    await student.save()
    return student
}

const deleteStudentById = async (studentId) => {
    const student = await getStudentById(studentId);
    for (const item of student.classes) {
        if (item.status === 'active') {
            throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Student is active in a class, not allowed to delete')
        }
    }
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

const getStudentAttendance = async (studentId, filter = {}) => {
    const { Attendance } = require('../models');

    // Verify student exists
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Get student's active classes
    const activeClasses = student.classes
    if (activeClasses.length === 0) {
        return {
            student: {
                id: student._id,
                name: student.userId?.name || 'N/A',
                email: student.userId?.email || 'N/A'
            },
            attendanceStats: {
                totalSessions: 0,
                presentSessions: 0,
                absentSessions: 0,
                lateSessions: 0,
                attendanceRate: 0
            },
            detailedAttendance: [],
            message: 'Student has no active classes'
        };
    }

    const classIds = activeClasses.map(c => c.classId);

    // Build attendance query
    const attendanceQuery = {
        classId: { $in: classIds },
        'students.studentId': new mongoose.Types.ObjectId(studentId),
        ...filter
    };

    // Add date filter if provided
    if (filter.startDate || filter.endDate) {
        attendanceQuery.date = {};
        if (filter.startDate) {
            attendanceQuery.date.$gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
            attendanceQuery.date.$lte = new Date(filter.endDate);
        }
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(attendanceQuery)
        .populate('classId', 'name grade section year status')
        .sort({ date: -1 });

    // Process attendance data
    let totalSessions = 0;
    let presentSessions = 0;
    let absentSessions = 0;
    let lateSessions = 0;
    const detailedAttendance = [];
    const absentSessions_details = [];

    attendanceRecords.forEach(record => {
        const studentAttendance = record.students.find(s =>
            s.studentId.toString() === studentId.toString()
        );

        if (studentAttendance) {
            totalSessions++;
            const attendanceInfo = {
                date: record.date,
                class: {
                    id: record.classId._id,
                    name: record.classId.name,
                    grade: record.classId.grade,
                    section: record.classId.section,
                    year: record.classId.year,
                    status: record.classId.status
                },
                status: studentAttendance.status,
                note: studentAttendance.note || '',
                checkedAt: studentAttendance.checkedAt
            };

            detailedAttendance.push(attendanceInfo);

            // Count by status
            switch (studentAttendance.status) {
                case 'present':
                    presentSessions++;
                    break;
                case 'absent':
                    absentSessions++;
                    absentSessions_details.push({
                        date: record.date,
                        class: attendanceInfo.class,
                        note: studentAttendance.note || 'No reason provided'
                    });
                    break;
                case 'late':
                    lateSessions++;
                    break;
            }
        }
    });

    // Calculate attendance rate
    const attendanceRate = totalSessions > 0 ? ((presentSessions + lateSessions) / totalSessions * 100).toFixed(2) : 0;

    return {
        student: {
            id: student._id,
            name: student.userId?.name || 'N/A',
            email: student.userId?.email || 'N/A'
        },
        attendanceStats: {
            totalSessions,
            presentSessions,
            absentSessions,
            lateSessions,
            attendanceRate: parseFloat(attendanceRate)
        },
        absentSessionsDetails: absentSessions_details,
        detailedAttendance: detailedAttendance,
        totalRecords: attendanceRecords.length
    };
};

const getStudentPayments = async (studentId, filter, options) => {
    const { Payment } = require('../models');
    const paymentFilter = { studentId, ...filter };
    const payments = await Payment.paginate(paymentFilter, options);
    return payments;
};

const getStudentSchedule = async (studentId) => {
    const student = await Student.findById(studentId)
        .populate('userId', 'name email')
        .populate({
            path: 'classes.classId',
            populate: {
                path: 'teacherId',
                select: 'userId',
                populate: {
                    path: 'userId',
                    select: 'name'
                }
            }
        });

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    if (!student.classes || student.classes.length === 0) {
        return {
            student: {
                id: student._id,
                name: student.userId?.name || 'N/A',
                email: student.userId?.email || 'N/A'
            },
            schedules: []
        };
    }

    // Get active classes only
    const activeClasses = student.classes.filter(classEnrollment =>
        classEnrollment.status === 'active' && classEnrollment.classId
    );

    if (activeClasses.length === 0) {
        return {
            student: {
                id: student._id,
                name: student.userId?.name || 'N/A',
                email: student.userId?.email || 'N/A'
            },
            schedules: [],
            message: 'Student has no active classes'
        };
    }

    // Build schedule for each active class
    const schedules = activeClasses.map(classEnrollment => {
        const classInfo = classEnrollment.classId;
        return {
            class: {
                id: classInfo._id,
                name: classInfo.name,
                grade: classInfo.grade,
                section: classInfo.section,
                year: classInfo.year,
                room: classInfo.room,
                status: classInfo.status
            },
            schedule: {
                startDate: classInfo.schedule?.startDate,
                endDate: classInfo.schedule?.endDate,
                dayOfWeeks: classInfo.schedule?.dayOfWeeks || [],
                timeSlots: classInfo.schedule?.timeSlots || {}
            },
            teacher: {
                id: classInfo.teacherId?._id,
                name: classInfo.teacherId?.userId?.name || 'Not assigned'
            },
            enrollmentInfo: {
                enrollmentDate: classEnrollment.enrollmentDate,
                discountPercent: classEnrollment.discountPercent,
                status: classEnrollment.status
            }
        };
    });

    return {
        student: {
            id: student._id,
            name: student.userId?.name || 'N/A',
            email: student.userId?.email || 'N/A'
        },
        schedules: schedules,
        totalActiveClasses: schedules.length
    };
};

/**
 * Get monthly student increase/decrease statistics
 * @param {Object} filter
 * @param {number} filter.year - Year to filter by
 * @param {number} filter.month - Month to filter by (1-12)
 * @param {Date} filter.startDate - Start date for custom range
 * @param {Date} filter.endDate - End date for custom range
 * @returns {Promise<Object>}
 */
const getMonthlyStudentChanges = async (filter = {}) => {
    try {
        const { year, month, startDate, endDate } = filter;

        // Determine date range
        let dateFilter = {};

        if (year && month) {
            // Filter by specific year and month
            dateFilter = {
                $gte: new Date(year, month - 1, 1), // First day of the month
                $lte: new Date(year, month, 0, 23, 59, 59) // Last day of the month
            };
        } else if (year) {
            // Filter by specific year
            dateFilter = {
                $gte: new Date(year, 0, 1), // January 1st
                $lte: new Date(year, 11, 31, 23, 59, 59) // December 31st
            };
        } else if (startDate && endDate) {
            // Custom date range
            dateFilter = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            // Default to current year
            const currentYear = new Date().getFullYear();
            dateFilter = {
                $gte: new Date(currentYear, 0, 1),
                $lte: new Date(currentYear, 11, 31, 23, 59, 59)
            };
        }

        // Aggregation for student increase (new registrations based on createdAt)
        const increaseAggregation = await Student.aggregate([
            {
                $match: {
                    createdAt: dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Aggregation for student decrease (soft deleted students based on deletedAt)
        const decreaseAggregation = await Student.aggregate([
            {
                $match: {
                    deleted: true,
                    deletedAt: {
                        $exists: true,
                        ...dateFilter
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$deletedAt" },
                        month: { $month: "$deletedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        const statusChangeAggregation = await Student.aggregate([
            {
                $match: {
                    updatedAt: dateFilter,
                    "classes.0": { $exists: true }
                }
            },
            {
                $addFields: {
                    allClassesCompleted: {
                        $allElementsTrue: {
                            $map: {
                                input: "$classes",
                                as: "class",
                                in: { $eq: ["$$class.status", "completed"] }
                            }
                        }
                    },
                    totalClasses: { $size: "$classes" },
                    completedClassesCount: {
                        $size: {
                            $filter: {
                                input: "$classes",
                                as: "class",
                                cond: { $eq: ["$$class.status", "completed"] }
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    allClassesCompleted: true,
                    totalClasses: { $gte: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$updatedAt" },
                        month: { $month: "$updatedAt" }
                    },
                    count: { $sum: 1 },
                    students: {
                        $push: {
                            studentId: "$_id",
                            totalClasses: "$totalClasses",
                            completedClasses: "$completedClassesCount"
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Combine decrease data (soft deletes + status changes)
        const combinedDecrease = [...decreaseAggregation];

        // Add status change counts to decrease data
        statusChangeAggregation.forEach(statusChange => {
            const existing = combinedDecrease.find(
                item => item.year === statusChange.year && item.month === statusChange.month
            );

            if (existing) {
                existing.count += statusChange.count;
            } else {
                combinedDecrease.push(statusChange);
            }
        });

        // Sort combined decrease data
        combinedDecrease.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Calculate summary statistics
        const totalIncrease = increaseAggregation.reduce((sum, item) => sum + item.count, 0);
        const totalDecrease = combinedDecrease.reduce((sum, item) => sum + item.count, 0);
        const netChange = totalIncrease - totalDecrease;

        return {
            summary: {
                totalIncrease,
                totalDecrease,
                netChange,
                period: {
                    startDate: dateFilter.$gte,
                    endDate: dateFilter.$lte
                }
            },
            increase: increaseAggregation,
            decrease: combinedDecrease
        };

    } catch (error) {
        console.error('Error in getMonthlyStudentChanges:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get monthly student changes');
    }
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
    getMonthlyStudentChanges
}