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
    'getAttendance', 'manageAttendance'
  ],
  teacher: [
    'getClasses', 'getStudents',
    'getPayments', 'managePayments',
    'getAttendance', 'manageAttendance'
  ],
  parent: ['getPayments', 'getAttendance']
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
