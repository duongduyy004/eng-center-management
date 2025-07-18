const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const classRoute = require('./class.route')
const studentRoute = require('./student.route')
const teacherRoute = require('./teacher.route')
const parentRoute = require('./parent.route')
const paymentRoute = require('./payment.route')
const attendanceRoute = require('./attendance.route')
const teacherPaymentRoute = require('./teacherPayment.route')
const announcementRoute = require('./announcement.route')
const dashboardRoute = require('./dasboard.route')
const vnPayRoute = require('./vnpay.route')
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/classes',
    route: classRoute
  },
  {
    path: '/students',
    route: studentRoute
  },
  {
    path: '/teachers',
    route: teacherRoute
  },
  {
    path: '/parents',
    route: parentRoute
  },
  {
    path: '/payments',
    route: paymentRoute
  },
  {
    path: '/attendances',
    route: attendanceRoute
  },
  {
    path: '/teacher-payments',
    route: teacherPaymentRoute
  },
  {
    path: '/announcements',
    route: announcementRoute
  },
  {
    path: '/dashboard',
    route: dashboardRoute
  },
  {
    path: '/vnpay',
    route: vnPayRoute
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
