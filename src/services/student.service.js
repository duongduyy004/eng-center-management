const httpStatus = require("http-status");
const { userService, classService } = require(".");
const { Student } = require("../models");
const ApiError = require("../utils/ApiError");

const createStudent = async (studentBody) => {
    return await Student.create(studentBody)
}

const queryStudents = async (filter, options) => {
    const users = await Student.paginate(filter, options);
    return users;
};

const getStudentById = async (studentId, populate) => {
    const student = await Student.findById(studentId).populate(populate)
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found')
    }
    return student
}

/**
 * @param {import("mongoose").ObjectId} studentId 
 * @param {Object} updateBody
 * @param {Object} [updateBody.userData]
 * @param {Object} [updateBody.studentData]
 */
const updateStudentById = async (studentId, updateBody) => {
    const student = await getStudentById(studentId)
    await userService.updateUserById(student.userId, updateBody.userData)
    Object.assign(student, updateBody.studentData)
    if (updateBody.studentData.classId) {
        const newClass = await classService.getClassById(updateBody.studentData.classId)
        newClass.studentIds.push(student.id)
    }
    await student.save()
    return student

}

module.exports = {
    createStudent,
    queryStudents,
    getStudentById,
    updateStudentById
}