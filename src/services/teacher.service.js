const { Teacher } = require("../models")

const createTeacher = async (teacherBody) => {

    return await Teacher.create(teacherBody)
}

module.exports = {
    createTeacher
}