const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { paymentService } = require('../services');

const getPayments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['studentId', 'classId', 'month', 'year', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await paymentService.queryPayments(filter, options);
    res.send(result);
});

const getPayment = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentById(req.params.paymentId);
    res.send(payment);
});

const updatePayment = catchAsync(async (req, res) => {
    const payment = await paymentService.updatePaymentById(req.params.paymentId, req.body);
    res.send(payment);
});

const deletePayment = catchAsync(async (req, res) => {
    await paymentService.deletePaymentById(req.params.paymentId);
    res.status(httpStatus.NO_CONTENT).send();
});

const recordPayment = catchAsync(async (req, res) => {
    const payment = await paymentService.recordPayment(req.params.paymentId, req.body);
    res.send(payment);
});

const getPaymentStatistics = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['studentId', 'classId', 'month', 'year', 'status']);
    const statistics = await paymentService.getPaymentStatistics(filter);
    res.send(statistics);
});

const markPaymentOverdue = catchAsync(async (req, res) => {
    const payment = await paymentService.markPaymentOverdue(req.params.paymentId);
    res.send(payment);
});

const getOverduePayments = catchAsync(async (req, res) => {
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await paymentService.getOverduePayments(options);
    res.send(result);
});

const sendPaymentReminder = catchAsync(async (req, res) => {
    const result = await paymentService.sendPaymentReminder(req.params.paymentId);
    res.send(result);
});

module.exports = {
    getPayments,
    getPayment,
    updatePayment,
    deletePayment,
    recordPayment,
    getPaymentStatistics,
    markPaymentOverdue,
    getOverduePayments,
    sendPaymentReminder
};