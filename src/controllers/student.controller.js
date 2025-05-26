const httpStatus = require("http-status");
const { Class } = require("../models");
const { parentService, studentService, userService } = require("../services");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { getStudentById } = require("../services/student.service");

const createStudent = catchAsync(async (req, res) => {
    const { studentData, parentData } = req.body
    //check if class was closed
    if (studentData.classId && await Class.findById(studentData.classId).status === 'CLOSE') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class was closed')
    }

    //creater user for student and parent
    const studentUser = await userService.createUser({
        email: studentData.email,
        password: studentData.password,
        name: studentData.name,
        role: studentData.role,
        dayOfBirth: studentData.dayOfBirth,
        phone: studentData?.phone
    })
    const parentUser = await userService.createUser({
        email: parentData.parent_email,
        password: parentData.parent_password,
        name: parentData.parent_name,
        role: parentData.role,
        dayOfBirth: parentData.dayOfBirth,
        phone: studentData?.phone
    })


    const parent = await parentService.createParent({ userId: parentUser.id })
    const student = await studentService.createStudent({
        classId: studentData?.classId,
        parentId: parent?.id,
        userId: studentUser.id,
        discountPercentage: studentData.discountPercentage
    })

    //update studentId in Parent collection
    await parent.updateOne({ studentId: student.id })
    //update studentIds in Class collection
    if (studentData.classId) {
        await Class.updateOne({ _id: studentData.classId, status: true }, { $push: { studentIds: student.id } })
    }

    res.status(httpStatus.CREATED).json({
        message: 'Create student successfully'
    })
})

const getStudents = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await studentService.queryStudents(filter, options);
    res.send(result);
})

const getStudent = catchAsync(async (req, res) => {
    const { populate } = req.query
    const student = await getStudentById(req.params.studentId, populate)
    res.send(student)
})

const updateStudent = catchAsync(async (req, res) => {
    const student = await studentService.updateStudentById(req.params.studentId, req.body)
    res.send(student)
})

const deleteStudent = catchAsync(async (req, res) => {
    res.send('delete student')
})

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent
}