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
    const teacher = await Teacher.create({ ...teacherData, userId: user.id })
    return await teacher.populate('userId')
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
    if (filter.email) {
        const users = await User.find({
            email: { $regex: filter.email, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        filter.userId = { $in: userIds };
        delete filter.email;
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

/**
 * Get available teachers (active teachers)
 * @returns {Promise<Array>}
 */
const getAvailableTeachers = async () => {
    const teachers = await Teacher.find({ isActive: true })
        .populate('userId', 'name email phone')
        .populate('classes', 'name grade section year status');

    return teachers.map(teacher => ({
        id: teacher._id,
        name: teacher.userId?.name || 'N/A',
        email: teacher.userId?.email || 'N/A',
        phone: teacher.userId?.phone || 'N/A',
        salaryPerLesson: teacher.salaryPerLesson,
        qualifications: teacher.qualifications,
        specialization: teacher.specialization,
        totalClasses: teacher.classes?.length || 0,
        classes: teacher.classes?.map(cls => ({
            id: cls._id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section,
            year: cls.year,
            status: cls.status
        })) || []
    }));
};

/**
 * Get classes assigned to a teacher
 * @param {ObjectId} teacherId
 * @returns {Promise<Object>}
 */
const getTeacherClasses = async (teacherId) => {
    const teacher = await Teacher.findById(teacherId)
        .populate('userId', 'name email phone')
        .populate({
            path: 'classes',
            select: 'name grade section year status schedule maxStudents feePerLesson room description totalLessons',
            options: { sort: { createdAt: -1 } }
        });

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
    }

    return {
        teacher: {
            id: teacher._id,
            name: teacher.userId?.name || 'N/A',
            email: teacher.userId?.email || 'N/A',
            phone: teacher.userId?.phone || 'N/A',
            salaryPerLesson: teacher.salaryPerLesson,
            qualifications: teacher.qualifications,
            specialization: teacher.specialization,
            isActive: teacher.isActive
        },
        classes: teacher.classes?.map(cls => ({
            id: cls._id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section,
            year: cls.year,
            status: cls.status,
            schedule: cls.schedule,
            maxStudents: cls.maxStudents,
            feePerLesson: cls.feePerLesson,
            room: cls.room,
            description: cls.description,
            totalLessons: cls.totalLessons
        })) || [],
        totalClasses: teacher.classes?.length || 0
    };
};

module.exports = {
    createTeacher,
    queryTeachers,
    getTeacherById,
    updateTeacherById,
    deleteTeacherById,
    getAvailableTeachers,
    getTeacherClasses
}