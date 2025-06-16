const allRoles = {
  user: [],
  student: [],
  admin: [
    'getUsers', 'manageUsers',
    'getClasses', 'manageClasses',
    'getStudents', 'manageStudents',
    'getPayments', 'managePayments',
    'getTeachers', 'manageTeachers',
    'getParents', 'manageParents',
    'getAttendance', 'manageAttendance',
    'getTeacherPayments', 'manageTeacherPayments'
  ],
  teacher: [
    'getClasses', 'getStudents',
    'getPayments', 'managePayments',
    'getAttendance', 'manageAttendance'
  ],
  parent: ['getPayments', 'getAttendance', 'payTuition', 'getStudents']
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
