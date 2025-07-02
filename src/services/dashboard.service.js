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

    return {
        totalStudent,
        totalTeacher,
        activeClasses,
        upcomingClasses,
        closedClasses,
        paymentInfo,
        teacherPaymentInfo
    }
}

const getTeacherDashboard = async (teacherId) => {
    const classes = (await Teacher.findById(teacherId).populate({ path: 'classes', select: 'status' }).select('classes')).classes;
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

    return {
        totalStudent: students.length,
        teachingClasses,
        closedClasses,
        upcomingClasses,
        paymentInfo
    }
}

const getParentDashboard = async (parentId) => {
    const parent = await Parent.findById(parentId)
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

    return {
        totalChildren: parent.studentIds.length,
        paymentInfo
    }
}

const getStudentDashboard = async (studentId) => {
    const student = await Student.findById(studentId)
    const activeClasses = student.classes.filter(item => item.status === 'active').length
    const completedClasses = student.classes.filter(item => item.status === 'completed').length
    const attendance = await studentService.getStudentAttendance(studentId)
    return {
        totalClasses: student.classes.length,
        activeClasses,
        completedClasses,
        attendance: attendance.attendanceStats
    }
}

module.exports = {
    getAdminDashboard,
    getTeacherDashboard,
    getParentDashboard,
    getStudentDashboard
}