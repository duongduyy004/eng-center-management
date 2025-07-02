const express = require('express')
const { dashboardController } = require('../../controllers');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { dashboardvalidation } = require('../../validations');
const route = express.Router()

route.route('/admin')
    .get(auth('getDashboards'), dashboardController.getAdminDashboard);

route.route('/teacher/:teacherId')
    .get(auth('getDashboards'), validate(dashboardvalidation.getTeacherDashboard), dashboardController.getTeacherDashboard);

route.route('/parent/:parentId')
    .get(auth('getDashboards'), validate(dashboardvalidation.getParentDashboard), dashboardController.getParentDashboard);

route.route('/student/:studentId')
    .get(auth('getDashboards'), validate(dashboardvalidation.getStudentDashboard), dashboardController.getStudentDashboard)
module.exports = route