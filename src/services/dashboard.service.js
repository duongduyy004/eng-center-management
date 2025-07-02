const { default: mongoose } = require("mongoose");
const { Student, Teacher, Class, Payment, TeacherPayment, Parent, Attendance } = require("../models");
const { studentService } = require("../services");

const getAdminDashboard = async () => {
    const totalStudent = await Student.countDocuments();
    const totalTeacher = await Teacher.countDocuments();
    const activeClasses = await Class.countDocuments({ status: 'active' });
    const upcomingClasses = await Class.countDocuments({ status: 'upcoming' });
    const closedClasses = await Class.countDocuments({ status: 'closed' });

    const paymentInfo = await Payment.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalPaidAmount: { $sum: "$paidAmount" },
                totalUnPaidAmount: { $sum: { $subtract: ['$finalAmount', '$paidAmount'] } }
            }
        },
        {
            $project: {
                totalRevenue: 1,
                totalPaidAmount: 1,
                totalUnPaidAmount: 1,
                _id: 0
            }
        }
    ])

    const teacherPaymentInfo = await TeacherPayment.aggregate([
        {
            $group: {
                _id: null,
                totalSalary: { $sum: "$totalAmount" },
                totalPaidAmount: { $sum: "$paidAmount" },
                totalUnPaidAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }
            }
        },
        {
            $project: {
                totalSalary: 1,
                totalPaidAmount: 1,
                totalUnPaidAmount: 1,
                _id: 0
            }
        }
    ])

    const payments = await Payment.find().sort({ updatedAt: 'desc' }).populate({ path: 'studentId', populate: 'userId' }).limit(5)
    let recentlyPayment = []
    for (const payment of payments) {
        recentlyPayment.push({
            name: payment.studentId.userId.name,
            paidAmount: payment.paidAmount,
            status: payment.status
        })
    }

    const teacherPayments = await TeacherPayment.find().sort({ updatedAt: 'desc' }).populate({ path: 'teacherId', populate: 'userId' }).limit(5)
    let recentlySalary = []
    for (const teacherPayment of teacherPayments) {
        recentlySalary.push({
            name: teacherPayment.teacherId.userId.name,
            paidAmount: teacherPayment.paidAmount,
            status: teacherPayment.status
        })
    }
    return {
        totalStudent,
        totalTeacher,
        activeClasses,
        upcomingClasses,
        closedClasses,
        paymentInfo: paymentInfo[0],
        teacherPaymentInfo: teacherPaymentInfo[0],
        recentlyPayment,
        recentlySalary
    }
}

const getTeacherDashboard = async (teacherId) => {
    const classes = (await Teacher.findById(teacherId).populate('classes').select('classes')).classes;
    const teachingClasses = classes.filter(item => item.status === 'active').length
    const closedClasses = classes.filter(item => item.status === 'closed').length
    const upcomingClasses = classes.filter(item => item.status === 'upcoming').length

    const classIds = classes.map(cls => cls.id)

    const students = await Student.findWithDeleted({
        'classes.classId': { $in: classIds }
    }).select('userId')

    const paymentInfo = await TeacherPayment.aggregate([
        { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
        {
            $group: {
                _id: null,
                totalSalary: { $sum: '$totalAmount' },
                totalPaidAmount: { $sum: '$paidAmount' },
                totalUnPaidAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }
            }
        },
        {
            $project: {
                totalSalary: 1,
                totalPaidAmount: 1,
                totalUnPaidAmount: 1,
                _id: 0
            }
        }
    ])

    let activeClasses = []
    for (const aClass of classes) {
        if (aClass.status === 'active') {
            activeClasses.push({
                name: aClass.name,
                schedule: aClass.schedule,
                room: aClass.room
            })
        }
    }

    const teacherPayment = await TeacherPayment.findOne({ teacherId }).sort({ month: 'desc' })
    let totalLessons = teacherPayment.classes.reduce((accumlator, currentValue) => accumlator + currentValue.totalLessons, 0)
    let recentlySalary = {
        month: teacherPayment.month,
        year: teacherPayment.year,
        totalLessons,
        salaryPerLesson: teacherPayment.salaryPerLesson,
        paidAmount: teacherPayment.paidAmount
    }
    return {
        totalStudent: students.length,
        teachingClasses,
        closedClasses,
        upcomingClasses,
        paymentInfo,
        activeClasses,
        recentlySalary
    }
}

const getParentDashboard = async (parentId) => {
    const parent = await Parent.findById(parentId).populate({ path: 'studentIds', populate: 'userId' })
    const studentIds = parent.studentIds.map(item => new mongoose.Types.ObjectId(item))
    const paymentInfo = await Payment.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalPaidAmount: { $sum: "$paidAmount" },
                totalUnPaidAmount: { $sum: { $subtract: ['$finalAmount', '$paidAmount'] } }
            }
        },
        {
            $project: {
                totalRevenue: 1,
                totalPaidAmount: 1,
                totalUnPaidAmount: 1,
                _id: 0
            }
        }
    ])

    const studentPayments = await Payment.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
            $group: {
                _id: "$studentId",
                totalAmount: { $sum: "$finalAmount" },
                totalPaidAmount: { $sum: "$paidAmount" },
                totalUnPaidAmount: { $sum: { $subtract: ['$finalAmount', '$paidAmount'] } },
            }
        },
        {
            $lookup: {
                from: 'students',
                localField: '_id',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'studentInfo.userId',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $project: {
                studentId: "$_id",
                studentName: { $arrayElemAt: ["$userInfo.name", 0] },
                studentEmail: { $arrayElemAt: ["$userInfo.email", 0] },
                totalAmount: 1,
                totalPaidAmount: 1,
                totalUnPaidAmount: 1,
                _id: 0
            }
        },
    ])

    return {
        totalChildren: parent.studentIds.length,
        paymentInfo: paymentInfo[0],
        studentPayments
    }
}

const getStudentDashboard = async (studentId) => {
    const student = await Student.findById(studentId).populate({
        path: 'classes',
        populate: {
            path: 'classId',
            populate: {
                path: 'teacherId',
                populate: 'userId'
            }
        }
    })
    const activeClasses = student.classes.filter(item => item.status === 'active').length
    const completedClasses = student.classes.filter(item => item.status === 'completed').length
    const attendance = await studentService.getStudentAttendance(studentId)

    const classList = student.classes.map(item => ({
        className: item.classId.name,
        room: item.classId.room,
        schedule: item.classId.schedule,
        teacherName: item.classId.teacherId.userId.name,
        status: item.status
    }))
    return {
        totalClasses: student.classes.length,
        activeClasses,
        completedClasses,
        attendance: attendance.attendanceStats,
        classList
    }
}

module.exports = {
    getAdminDashboard,
    getTeacherDashboard,
    getParentDashboard,
    getStudentDashboard
}