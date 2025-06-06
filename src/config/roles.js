const allRoles = {
  user: [],
  student: [],
  admin: [
    'getUsers', 'manageUsers',
    'getClasses', 'manageClasses',
    'getStudents', 'manageStudents',
    'getPayments', 'managePayments'
  ],
  teacher: [
    'getClasses', 'getStudents',
    'getPayments', 'managePayments'
  ],
  parent: ['getPayments']
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
