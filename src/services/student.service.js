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
    const activeClasses = student.classes.filter(c => c.status === 'active');
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
        .populate('classId', 'name grade section year')
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
                    year: record.classId.year
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
        period: {
            startDate: filter.startDate || null,
            endDate: filter.endDate || null,
            totalRecords: attendanceRecords.length
        }
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
 * Get monthly student enrollment changes statistics
 * @param {Object} filter
 * @param {number} filter.year - Year to filter by
 * @param {number} filter.month - Number of months to show
 * @param {ObjectId} filter.classId - Filter by specific class
 * @returns {Promise<Object>}
 */
const getMonthlyStudentChanges = async (filter = {}) => {
    const { year, month, classId } = filter;

    // Determine date range
    let dateRange = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 1)
    };

    // Build match stage for aggregation
    const matchStage = {
        'classes.enrollmentDate': dateRange
    };

    if (classId) {
        matchStage['classes.classId'] = new mongoose.Types.ObjectId(classId);
    }

    // Aggregation pipeline to get monthly enrollment statistics
    const enrollmentStats = await Student.aggregate([
        { $unwind: '$classes' },
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$classes.enrollmentDate' },
                    month: { $month: '$classes.enrollmentDate' },
                    classId: '$classes.classId'
                },
                newEnrollments: { $sum: 1 },
                students: {
                    $push: {
                        studentId: '$_id',
                        enrollmentDate: '$classes.enrollmentDate',
                        status: '$classes.status',
                        discountPercent: '$classes.discountPercent'
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'classes',
                localField: '_id.classId',
                foreignField: '_id',
                as: 'classInfo'
            }
        },
        {
            $unwind: {
                path: '$classInfo',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                totalNewEnrollments: { $sum: '$newEnrollments' },
                classesByMonth: {
                    $push: {
                        classId: '$_id.classId',
                        className: '$classInfo.name',
                        classGrade: '$classInfo.grade',
                        classSection: '$classInfo.section',
                        newEnrollments: '$newEnrollments',
                        students: '$students'
                    }
                }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        }
    ]);

    // Get withdrawal statistics (students who changed status from active to completed)
    const withdrawalStats = await Student.aggregate([
        { $unwind: '$classes' },
        {
            $match: {
                'classes.status': 'completed',
                'classes.enrollmentDate': dateRange
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$classes.enrollmentDate' },
                    month: { $month: '$classes.enrollmentDate' }
                },
                totalCompletions: { $sum: 1 }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        }
    ]);

    // Transform data into monthly format
    const monthlyData = {};
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize monthly data
    enrollmentStats.forEach(stat => {
        const monthKey = `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`;
        const monthName = monthNames[stat._id.month - 1];

        monthlyData[monthKey] = {
            year: stat._id.year,
            month: stat._id.month,
            monthName: monthName,
            newEnrollments: stat.totalNewEnrollments,
            completions: 0,
            netChange: stat.totalNewEnrollments,
            classesByMonth: stat.classesByMonth
        };
    });

    // Add withdrawal data
    withdrawalStats.forEach(stat => {
        const monthKey = `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].completions = stat.totalCompletions;
            monthlyData[monthKey].netChange = monthlyData[monthKey].newEnrollments - stat.totalCompletions;
        }
    });

    // Convert to array and sort
    const monthlyArray = Object.keys(monthlyData)
        .sort()
        .map(key => monthlyData[key]);

    // Calculate totals
    const totalNewEnrollments = monthlyArray.reduce((sum, month) => sum + month.newEnrollments, 0);
    const totalCompletions = monthlyArray.reduce((sum, month) => sum + month.completions, 0);
    const netChange = totalNewEnrollments - totalCompletions;

    return {
        summary: {
            totalNewEnrollments,
            totalCompletions,
            netChange,
            period: {
                startDate: dateRange.$gte,
                endDate: dateRange.$lte
            }
        },
        monthlyData: monthlyArray,
        totalMonths: monthlyArray.length
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
    getStudentSchedule,
    getMonthlyStudentChanges
}