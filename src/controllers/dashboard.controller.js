const httpStatus = require("http-status")
const { dashboardSerivce } = require("../services")
const catchAsync = require("../utils/catchAsync")

const getAdminDashboard = catchAsync(async (req, res) => {
    const result = await dashboardSerivce.getAdminDashboard()
    res.status(httpStatus.OK).json({
        code: 200,
        data: result
    })
})

const getTeacherDashboard = catchAsync(async (req, res) => {
    const result = await dashboardSerivce.getTeacherDashboard(req.params.teacherId)
    res.status(httpStatus.OK).json({
        code: 200,
        data: result
    })
})

const getParentDashboard = catchAsync(async (req, res) => {
    const result = await dashboardSerivce.getParentDashboard(req.params.parentId)
    res.status(httpStatus.OK).json({
        code: 200,
        data: result
    })
})

const getStudentDashboard = catchAsync(async (req, res) => {
    const result = await dashboardSerivce.getStudentDashboard(req.params.studentId)
    res.status(httpStatus.OK).json({
        code: 200,
        data: result
    })
})

module.exports = {
    getAdminDashboard,
    getTeacherDashboard,
    getParentDashboard,
    getStudentDashboard
}