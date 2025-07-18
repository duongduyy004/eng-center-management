const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { parentService, paymentService } = require('../services');

const createParent = catchAsync(async (req, res) => {
    const { userData, parentData } = req.body;
    const parent = await parentService.createParent(userData, parentData);
    res.status(httpStatus.CREATED).json({
        message: 'Create parent successfully',
        data: parent
    });
});

const getParents = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await parentService.queryParents(filter, options);
    res.send(result);
});

const getParent = catchAsync(async (req, res) => {
    const parent = await parentService.getParentById(req.params.parentId);
    res.send(parent);
});

const updateParent = catchAsync(async (req, res) => {
    const parent = await parentService.updateParentById(req.params.parentId, req.body, req.user);
    res.send(parent);
});

const deleteParent = catchAsync(async (req, res) => {
    await parentService.deleteParentById(req.params.parentId);
    res.status(httpStatus.NO_CONTENT).send();
});

const addChild = catchAsync(async (req, res) => {
    const { studentId, parentId } = req.body;
    const child = await parentService.addChild(parentId, studentId)
    res.send(child)
})

const deleteChild = catchAsync(async (req, res) => {
    const { studentId, parentId } = req.body
    const child = await parentService.deleteChild(parentId, studentId)
    res.send(child)
})

const payTuition = catchAsync(async (req, res) => {
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    const paymentData = { ...req.body, ipAddr };
    const paymentUrl = paymentService.redirectVNPay(paymentData);
    res.send(paymentUrl)
})

module.exports = {
    createParent,
    getParents,
    getParent,
    updateParent,
    deleteParent,
    addChild,
    deleteChild,
    payTuition
};