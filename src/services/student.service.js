const { Student } = require("../models")

const createStudent = async (studentBody) => {
    return await Student.create(studentBody)
}

const queryStudents = async (filter, options) => {
    const users = await Student.paginate(filter, options);
    return users;
};

const getStudentById = async (studentId, populate) => {
    const student = await Student.findById(studentId).populate(populate)
    return student
}

module.exports = {
    createStudent,
    queryStudents,
    getStudentById
}