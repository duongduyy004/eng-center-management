const httpStatus = require("http-status")
const { userService, classService } = require(".")
const { Teacher, Class } = require("../models")
const ApiError = require("../utils/ApiError")

/**
 * 
 * @param {Object} teacherBody
 * @param {Object} [teacherBody.userData]
 * @param {Object} [teacherBody.teacherData] 
 * @returns 
 */
const createTeacher = async (teacherBody) => {
    const { userData, teacherData } = teacherBody

    const user = await userService.createUser({ ...userData, role: 'teacher' })
    return await Teacher.create({ ...teacherData, userId: user.id })
}

const queryTeachers = async (filter, options) => {
    return await Teacher.paginate(filter, options)
}

const getTeacherById = async (teacherId) => {
    return await Teacher.findById(teacherId)
}

/**
 * 
 * @param {Object} updateBody
 * @param {Object} [updateBody.userData]
 * @param {Object} [updateBody.teacherData] 
 * @returns 
 */
const updateTeacherById = async (teacherId, updateBody, role) => {
    const { userData, teacherData } = updateBody
    const teacher = await getTeacherById(teacherId)

    if (userData) {
        await userService.updateUserById(teacher.userId, userData)
    }

    if (teacherData.salaryPerLesson && role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot change salary per lesson')
    }

    if (teacherData) {
        Object.assign(teacher, teacherData)
        await teacher.save()
    }

    return teacher
}

const deleteTeacherById = async (teacherId) => {
    const teacher = await getTeacherById(teacherId);
    await userService.deleteUserById(teacher.userId)
    await teacher.delete();
    return teacher;
}

module.exports = {
    createTeacher,
    queryTeachers,
    getTeacherById,
    updateTeacherById,
    deleteTeacherById
}