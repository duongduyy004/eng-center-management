const { Class } = require("../models");
const catchAsync = require("../utils/catchAsync");
const { classService } = require('../services')
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const getClasses = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await classService.queryClasses(filter, options);
    res.send(result);
})

const getClass = catchAsync(async (req, res) => {
    const aClass = await classService.getClassById(req.params.classId);
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }
    res.send(aClass);
})

const createClass = catchAsync(async (req, res) => {
    const aClass = await classService.createClass(req.body)
    res.status(httpStatus.CREATED).send(aClass);
})

const updateClass = catchAsync(async (req, res) => {
    const aClass = await classService.updateClass(req.params.classId, req.body)
    res.send(aClass)
})

/**
 * Enroll student to class
 */
const enrollStudentToClass = catchAsync(async (req, res) => {
    const studentList = req.body
    const classId = req.params.classId;
    const result = []

    studentList.map(item => {
        result.push(async () => {
            await classService.enrollStudentToClass(classId, item.studentId, {
                discountPercent: item.discountPercent,
                reason: item.reason
            });
        })
    })

    res.status(httpStatus.CREATED).send({
        message: 'Student enrolled successfully',
        data: result
    });
});

/**
 * Remove student from class
 */
const removeStudentFromClass = catchAsync(async (req, res) => {
    const { classId, studentId } = req.params;

    const result = await classService.removeStudentFromClass(classId, studentId);
    res.send(result);
});

/**
 * Transfer student between classes
 */
const transferStudent = catchAsync(async (req, res) => {
    const { fromClassId, toClassId, studentId, reason, discountPercent } = req.body;

    const result = await classService.transferStudent(fromClassId, toClassId, studentId, {
        reason,
        discountPercent
    });

    res.send({
        message: 'Student transferred successfully',
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

module.exports = {
    getClasses,
    createClass,
    updateClass,
    getClass,
    enrollStudentToClass,
    removeStudentFromClass,
    transferStudent,
    getClassEnrollmentHistory
}