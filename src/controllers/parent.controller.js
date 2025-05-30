const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { parentService } = require('../services');

const createParent = catchAsync(async (req, res) => {
    // Support both structured and legacy format
    const { userData, parentData, ...legacyData } = req.body;

    let parent;
    if (userData && parentData) {
        // New structured format
        parent = await parentService.createParent(userData, parentData);
    } else {
        // Legacy flat format
        parent = await parentService.createParent(legacyData);
    }

    res.status(httpStatus.CREATED).send(parent);
});

const getParents = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'email', 'phone']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await parentService.queryParents(filter, options);
    res.send(result);
});

const getParent = catchAsync(async (req, res) => {
    const parent = await parentService.getParentById(req.params.parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    res.send(parent);
});

const updateParent = catchAsync(async (req, res) => {
    const parent = await parentService.updateParentById(req.params.parentId, req.body);
    res.send(parent);
});

const deleteParent = catchAsync(async (req, res) => {
    await parentService.deleteParentById(req.params.parentId);
    res.status(httpStatus.NO_CONTENT).send();
});


module.exports = {
    createParent,
    getParents,
    getParent,
    updateParent,
    deleteParent,
};