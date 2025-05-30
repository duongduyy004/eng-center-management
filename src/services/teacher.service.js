const { Teacher } = require("../models")

/**
 * 
 * @param {Object} teacherBody
 * @param {Object} [teacherBody.userData]
 * @param {Object} [teacherBody.teacherData] 
 * @returns 
 */
const createTeacher = async (teacherBody) => {

    return await Teacher.create(teacherBody)
}

module.exports = {
    createTeacher
}