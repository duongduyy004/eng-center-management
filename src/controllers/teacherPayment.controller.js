const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { teacherPaymentService } = require('../services');


const getTeacherPayments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['teacherId', 'classId', 'month', 'year', 'status', 'startMonth', 'endMonth']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await teacherPaymentService.queryTeacherPayments(filter, options);
    res.send(result);
});

const getTeacherPayment = catchAsync(async (req, res) => {
    const teacherPayment = await teacherPaymentService.getTeacherPaymentByTeacherId(req.params.teacherId);
    res.send(teacherPayment);
});


const recordTeacherPayment = catchAsync(async (req, res) => {
    const teacherPayment = await teacherPaymentService.recordTeacherPayment(
        req.params.teacherId,
        req.body,
        req.query
    );
    res.send(teacherPayment);
});


module.exports = {
    getTeacherPayments,
    getTeacherPayment,
    recordTeacherPayment,
};
