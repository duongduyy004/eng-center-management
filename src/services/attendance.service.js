const httpStatus = require('http-status');
const { Attendance, Student, Class } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const teacherPaymentService = require('./teacherPayment.service');
const { autoUpdatePaymentRecords } = require('./payment.service');

/**
 * Transform attendance data to match required format
 * @param {Object} attendance - Mongoose attendance document with populated fields
 * @returns {Object} - Formatted attendance data
 */
const transformAttendanceData = (attendance) => {
    return {
        attendanceId: attendance.id,
        classId: {
            name: attendance.classId.name,
            grade: attendance.classId.grade,
            section: attendance.classId.section,
            id: attendance.classId._id
        },
        date: attendance.date,
        teacherId: attendance.teacherId,
        students: attendance.students.map(student => ({
            studentId: {
                name: student.studentId.userId.name,
                id: student.studentId._id
            },
            status: student.status,
            note: student.note,
            checkedAt: student.checkedAt
        })),
        isCompleted: attendance.isCompleted
    };
};

/**
 * Create an attendance session for a class
 * @param {Object} attendanceBody
 * @param {string} attendanceBody.classId
 * @param {Date} attendanceBody.date
 * @param {string} attendanceBody.teacherId
 * @returns {Promise<Attendance>}
 */
const createAttendanceSession = async (attendanceBody) => {
    const { classId, date = Date.now() } = attendanceBody;

    // Verify class exists
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
        classId,
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    }); if (existingAttendance) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Attendance session already exists for this class on this date');
    }

    // Get all students in the class
    const studentsInClass = await Student.find({
        'classes.classId': classId,
        'classes.status': 'active'
    });

    // Create attendance records for all students (default: absent)
    const studentAttendanceRecords = studentsInClass.map(student => ({
        studentId: student._id,
        status: 'absent',
        checkedAt: new Date()
    }));    // Create attendance session
    const attendance = await Attendance.create({
        classId,
        date,
        students: studentAttendanceRecords,
        isCompleted: false
    });

    return transformAttendanceData(
        await attendance.populate([
            { path: 'classId', select: 'name grade section' },
            { path: 'students.studentId', select: 'userId', populate: { path: 'userId', select: 'name' } }
        ])
    );
};

/**
 * Get today's attendance session for a class or create new one
 * @param {string} classId
 * @param {string} teacherId
 * @returns {Promise<Attendance>}
 */
const getTodayAttendanceSession = async (classId) => {
    // Check if class exists
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    // Check if class has schedule
    if (!classInfo.schedule) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class schedule not found');
    }

    const today = new Date(new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check if today is in the scheduled days
    if (!classInfo.schedule.dayOfWeeks || !classInfo.schedule.dayOfWeeks.includes(dayOfWeek)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No class scheduled for today');
    }

    // Check if today is within the class date range
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(classInfo.schedule.startDate);
    const endDate = new Date(classInfo.schedule.endDate);

    // Compare dates only (ignore time)
    const classStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const classEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (todayDate < classStartDate || todayDate > classEndDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Today is not within the class schedule period');
    }

    // Check if attendance session already exists for today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let attendance = await Attendance.findOne({
        classId,
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    }).populate([
        { path: 'classId', select: 'name grade section' },
        { path: 'students.studentId', select: 'userId studentId', populate: { path: 'userId', select: 'name' } }
    ]);

    // If attendance session doesn't exist, create new one
    if (!attendance) {
        const attendanceBody = {
            classId,
            date: new Date(),
        };
        attendance = await createAttendanceSession(attendanceBody);
    } else {
        // Transform existing attendance to required format
        attendance = transformAttendanceData(attendance)
    }

    return attendance;
};

/**
 * Update attendance session (can modify even if completed)
 * @param {string} attendanceId
 * @param {Array} studentsData
 * @param {string} studentsData[].studentId
 * @param {string} studentsData[].status
 * @param {string} [studentsData[].note]
 * @returns {Promise<Attendance>}
 */
const updateAttendanceSession = async (attendanceId, studentsData) => {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendance session not found');
    }

    // Update attendance for each student
    studentsData.forEach(studentData => {
        const studentIndex = attendance.students.findIndex(
            student => student.studentId.toString() === studentData.studentId
        );

        if (studentIndex !== -1) {
            attendance.students[studentIndex].status = studentData.status;
            attendance.students[studentIndex].note = studentData.note || '';
            attendance.students[studentIndex].checkedAt = new Date();
        }
    });

    await attendance.save();

    // Auto update/create payment records after attendance update
    autoUpdatePaymentRecords(attendance);

    // Auto update/create teacher payment records after attendance update
    autoUpdateTeacherPaymentRecords(attendance);

    return transformAttendanceData(
        await attendance.populate([
            { path: 'classId', select: 'name grade section' },
            { path: 'students.studentId', select: 'userId', populate: { path: 'userId', select: 'name' } }
        ])
    );
};

/**
 * Complete an attendance session
 * @param {string} attendanceId
 * @returns {Promise<Attendance>}
 */
const completeAttendanceSession = async (attendanceId) => {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendance session not found');
    }

    if (attendance.isCompleted) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Attendance session is already completed');
    } attendance.isCompleted = true;
    await attendance.save();

    return transformAttendanceData(
        await attendance.populate([
            { path: 'classId', select: 'name grade section' },
            { path: 'teacherId', select: 'userId', populate: { path: 'userId', select: 'name' } },
            { path: 'students.studentId', select: 'userId', populate: { path: 'userId', select: 'name' } }
        ])
    );
};

/**
 * Get attendance by ID
 * @param {string} attendanceId
 * @returns {Promise<Attendance>}
 */
const getAttendanceById = async (attendanceId) => {
    const attendance = await Attendance.findById(attendanceId).populate([
        { path: 'classId', select: 'name grade section' },
        { path: 'students.studentId', select: 'userId', populate: { path: 'userId', select: 'name' } }
    ]);
    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found');
    }

    return transformAttendanceData(attendance);
};

/**
 * Query attendance records
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryAttendance = async (filter, options) => {
    const attendance = await Attendance.paginate(filter, options);
    return attendance;
};

/**
 * Delete attendance session
 * @param {string} attendanceId
 * @returns {Promise<Attendance>}
 */
const deleteAttendanceById = async (attendanceId) => {
    const attendance = await getAttendanceById(attendanceId);
    await Attendance.findByIdAndDelete(attendanceId);
    return attendance;
};

/**
 * Auto update/create teacher payment records when attendance is updated
 * @param {Object} attendance - Attendance object
 */
const autoUpdateTeacherPaymentRecords = async (attendance) => {
    try {
        await teacherPaymentService.autoUpdateTeacherPayment({
            classId: attendance.classId,
            date: attendance.date
        });
    } catch (error) {
        logger.error('Error updating teacher payment records:', error);
    }
};

module.exports = {
    createAttendanceSession,
    getTodayAttendanceSession,
    updateAttendanceSession,
    completeAttendanceSession,
    getAttendanceById,
    queryAttendance,
    deleteAttendanceById
};