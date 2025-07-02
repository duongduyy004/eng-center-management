const express = require('express')
const { dashboardController } = require('../../controllers')
const route = express.Router()

route.route('/admin')
    .get(dashboardController.getAdminDashboard);

route.route('/teacher/:teacherId')
    .get(dashboardController.getTeacherDashboard);

route.route('/parent/:parentId')
    .get(dashboardController.getParentDashboard);

route.route('/student/:studentId')
    .get(dashboardController.getStudentDashboard)
module.exports = route