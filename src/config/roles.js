const allRoles = {
  user: [],
  student: [],
  admin: ['getUsers', 'manageUsers', 'getClasses', 'manageClasses', 'getStudents', 'manageStudents'],
  teacher: [],
  parent: []
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
