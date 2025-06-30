const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { paymentService } = require('../services');

const getTotalPayment = catchAsync(async (req, res) => {
    const result = await paymentService.getTotalPayment()
    res.status(httpStatus.OK).json({
        message: 'Success',
        total: result
    })
})

const getPayments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['studentId', 'classId', 'month', 'year', 'status', 'startMonth', 'endMonth']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await paymentService.queryPayments(filter, options);
    res.send(result);
});

const recordPayment = catchAsync(async (req, res) => {
    const payment = await paymentService.recordPayment(req.params.paymentId, req.body);
    res.send(payment);
});

const sendPaymentReminder = catchAsync(async (req, res) => {
    const result = await paymentService.sendPaymentReminder(req.params.paymentId);
    res.send(result);
});

module.exports = {
    getPayments,
    recordPayment,
    sendPaymentReminder,
    getTotalPayment
};