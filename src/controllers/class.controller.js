const catchAsync = require("../utils/catchAsync");
const { classService } = require('../services')
const httpStatus = require('http-status');
const pick = require('../utils/pick');

const getClasses = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['year', 'grade']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await classService.queryClasses(filter, options);
    res.send(result);
})

const getClass = catchAsync(async (req, res) => {
    const aClass = await classService.getClassById(req.params.classId);
    res.status(httpStatus.OK).json({
        message: 'Get class successfully',
        data: aClass
    });
})

const createClass = catchAsync(async (req, res) => {
    const aClass = await classService.createClass(req.body)
    res.status(httpStatus.CREATED).send(aClass);
})

const updateClass = catchAsync(async (req, res) => {
    const aClass = await classService.updateClass(req.params.classId, req.body)
    res.status(httpStatus.OK).json({
        message: 'Update class successfully',
        data: aClass
    })
})

/**
 * Enroll student(s) to class
 */
const enrollStudentToClass = catchAsync(async (req, res) => {
    const classId = req.params.classId;
    let studentData = req.body;

    // Ensure we have an array format
    if (!Array.isArray(studentData)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Request body must be an array of student objects with studentId and discountPercent',
            expectedFormat: '[{ "studentId": "64a1b2c3d4e5f6789012345", "discountPercent": 10 }]'
        });
    }

    const result = await classService.enrollStudentToClass(classId, studentData);

    const successCount = result.successfulCount;
    delete successfulCount

    res.status(httpStatus.CREATED).json({
        message: `Successfully enrolled ${successCount} student(s) to class`,
        data: result
    });
});

/**
 * Get class enrollment history
 */
const getClassEnrollmentHistory = catchAsync(async (req, res) => {
    const classId = req.params.classId;
    const { Student } = require('../models');

    const enrollmentHistory = await Student.aggregate([
        { $unwind: '$classes' },
        { $match: { 'classes.classId': new mongoose.Types.ObjectId(classId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $project: {
                studentId: '$_id',
                name: '$user.name',
                email: '$user.email',
                enrollmentDate: '$classes.enrollmentDate',
                withdrawalDate: '$classes.withdrawalDate',
                status: '$classes.status',
                discountPercent: '$classes.discountPercent'
            }
        },
        { $sort: { enrollmentDate: -1 } }
    ]);

    res.send({
        classId,
        enrollmentHistory,
        total: enrollmentHistory.length
    });
});

/**
 * Get students list of a class
 */
const getClassStudents = catchAsync(async (req, res) => {
    const classId = req.params.classId;
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await classService.getClassStudents(classId, options);

    res.send({
        message: 'Class students retrieved successfully',
        data: result
    });
});

/**
 * Remove student from class
 */
const removeStudentFromClass = catchAsync(async (req, res) => {
    const { classId } = req.params;
    const { studentId } = req.body

    const result = await classService.removeStudentFromClass(classId, studentId);

    res.send({
        message: 'Student removed from class successfully',
        data: result
    });
});

/**
 * Assign teacher to class
 */
const assignTeacherToClass = catchAsync(async (req, res) => {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const result = await classService.assignTeacherToClass(classId, teacherId);

    res.send({
        message: 'Teacher assigned to class successfully',
        data: result
    });
});

/**
 * Unassign teacher from class
 */
const unassignTeacherFromClass = catchAsync(async (req, res) => {
    const { classId } = req.params;

    const result = await classService.unassignTeacherFromClass(classId);

    res.send({
        message: 'Teacher unassigned from class successfully',
        data: result
    });
});

module.exports = {
    getClasses,
    createClass,
    updateClass,
    getClass,
    enrollStudentToClass,
    getClassEnrollmentHistory,
    getClassStudents,
    removeStudentFromClass,
    assignTeacherToClass,
    unassignTeacherFromClass,
}