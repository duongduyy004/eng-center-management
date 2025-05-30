const httpStatus = require("http-status");
const { studentService } = require("../services");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { getStudentById } = require("../services/student.service");

const createStudent = catchAsync(async (req, res) => {
    const result = await studentService.createStudent(req.body)
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
    await studentService.deleteStudentById(req.params.studentId);
    res.status(httpStatus.NO_CONTENT).send();
})

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
}