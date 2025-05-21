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
    if (await Class.findById(studentData.classId).status === 'CLOSE') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class was closed')
    }

    const parent = await parentService.createParent({ studentIds: [], unpaid: 0, })
    const student = await studentService.createStudent({
        classId: studentData?.classId,
        parentId: parent?.id,
        attended: 0,
        absent: 0,
        absentDates: [],
        fee: studentData.fee || 0,
        discount: studentData.discount || 0
    })

    //update studentId in Parent collection
    await parent.updateOne({ studentId: student.id })
    //update studentIds in Class collection
    if (studentData.classId) {
        await Class.updateOne({ _id: studentData.classId, status: 'OPEN' }, { $push: { studentIds: student.id } })
    }

    //creater user for student and parent
    await userService.createUser({ email: studentData.email, password: studentData.password, name: studentData.name, profileId: student.id })
    await userService.createUser({ email: parentData.parent_email, password: parentData.parent_password, name: parentData.parent_name, profileId: parent.id })
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
    const user = await userService.getUserById(req.params.userId)
    const student = await getStudentById(user.profileId, populate)
    res.send(student)
})

module.exports = {
    createStudent,
    getStudents,
    getStudent
}