const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { paymentService, vnpayService } = require('../services');

const getTotalPayment = catchAsync(async (req, res) => {
    const result = await paymentService.getTotalPayment()
    res.status(httpStatus.OK).json({
        message: 'Success',
        data: result
    })
})

const getPayments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['studentId', 'classId', 'month', 'year', 'status', 'startMonth', 'endMonth']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await paymentService.queryPayments(filter, options);
    res.send(result);
});

const recordPayment = catchAsync(async (req, res) => {
    const { paymentId } = req.params
    const payemntData = req.body
    const payment = await paymentService.recordPayment(paymentId, payemntData);
    res.send(payment);
});

const verifyReturnURL = catchAsync(async (req, res) => {
    const result = await vnpayService.verifyReturnURL(req.query);
    if (result.isSuccess) {
        res.redirect('https://english-center-web-h2d.vercel.app')
    }
    else {
        res.status(200).json(result.message)
    }
})

const verifyIPN = catchAsync(async (req, res) => {
    const result = await vnpayService.verifyIPN(req.query)
    const { vnp_Amount, vnp_CardType, vnp_OrderInfo } = result
    let method = ''
    if (vnp_CardType === 'ATM') {
        method = 'bank_transfer'
    } else {
        method = 'card'
    }

    const paymentId = result.vnp_TxnRef.toString().split('.')[0].trim()
    const paymentData = {
        amount: vnp_Amount,
        method,
        note: vnp_OrderInfo
    }
    await paymentService.recordPayment(paymentId, paymentData);
    res.status(httpStatus.NO_CONTENT)
})
const sendPaymentReminder = catchAsync(async (req, res) => {
    const result = await paymentService.sendPaymentReminder(req.params.paymentId);
    res.send(result);
});

module.exports = {
    getPayments,
    recordPayment,
    sendPaymentReminder,
    getTotalPayment,
    verifyReturnURL,
    verifyIPN
};