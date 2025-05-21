const { Class } = require("../models");
const catchAsync = require("../utils/catchAsync");
const { classService } = require('../services')
const httpStatus = require('http-status');
const pick = require('../utils/pick');

const getClasses = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await classService.queryClasses(filter, options);
    res.send(result);
})

const createClass = catchAsync(async (req, res) => {
    const aClass = await classService.createClass(req.body)
    res.status(httpStatus.CREATED).send(aClass);
})

const updateClass = catchAsync(async (req, res) => {
    const aClass = await classService.updateClass(req.params.classId, req.body)
    res.send(aClass)
})

module.exports = {
    getClasses,
    createClass,
    updateClass
}