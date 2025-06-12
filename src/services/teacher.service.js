const httpStatus = require("http-status")
const { userService, classService } = require(".")
const { Teacher, Class, User } = require("../models")
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
    if (filter.name) {
        const users = await User.find({
            name: { $regex: filter.name, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        filter.userId = { $in: userIds };
        delete filter.name;
    }
    return await Teacher.paginate(filter, { ...options, populate: 'userId' })
}

const getTeacherById = async (teacherId) => {
    const teacher = await Teacher.findById(teacherId).populate('userId')
    if (!teacher) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher not found')
    }
    return teacher
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
        await userService.updateUserById(teacher.userId, { ...userData, role: 'teacher' })
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