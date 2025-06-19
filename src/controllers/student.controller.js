const httpStatus = require("http-status");
const { studentService } = require("../services");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { getStudentById } = require("../services/student.service");

const createStudent = catchAsync(async (req, res) => {
    const result = await studentService.createStudent(req.body)
    res.status(httpStatus.CREATED).json({
        message: 'Create student successfully',
        data: result
    })
})

const getStudents = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role', 'email']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await studentService.queryStudents(filter, options);
    res.send(result);
})

const getStudent = catchAsync(async (req, res) => {
    const { populate } = req.query
    const student = await getStudentById(req.params.studentId, populate)
    res.send(student)
})

const updateStudent = catchAsync(async (req, res) => {
    const student = await studentService.updateStudentById(req.params?.studentId, req?.body, req.user)
    res.send(student)
})

const deleteStudent = catchAsync(async (req, res) => {
    await studentService.deleteStudentById(req.params.studentId);
    res.status(httpStatus.NO_CONTENT).send();
})

const getMonthlyStudentChanges = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['year', 'months', 'startDate', 'endDate', 'classId']);
    const result = await studentService.getMonthlyStudentChanges(filter);
    res.send({
        message: 'Monthly student changes retrieved successfully',
        data: result
    });
});

const getStudentSchedule = catchAsync(async (req, res) => {
    const schedule = await studentService.getStudentSchedule(req.params.studentId);
    res.send({
        message: 'Student schedule retrieved successfully',
        data: schedule
    });
});

const getStudentAttendance = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['startDate', 'endDate', 'classId']);
    const attendance = await studentService.getStudentAttendance(req.params.studentId, filter);
    res.send({
        message: 'Student attendance retrieved successfully',
        data: attendance
    });
});

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    getMonthlyStudentChanges,
    getStudentSchedule,
    getStudentAttendance,
}