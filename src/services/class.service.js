const httpStatus = require("http-status");
const { Class } = require("../models");
const ApiError = require("../utils/ApiError");

const queryClasses = async (filter, options) => {
    const aClass = await Class.paginate(filter, options);
    return aClass;
}

const getClassByNameAndYear = async (name, year) => {
    const aClass = await Class.findOne({ name, year })
    return aClass
}

/**
 * Create a class
 * @param {Object} classBody
 * @returns {Promise<Class>}
 */
const createClass = async (classBody) => {
    if (classBody && getClassByNameAndYear(classBody?.name, classBody?.year)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class already exsit')
    }
    return await Class.create(classBody)
};

const updateClass = async (classId, classUpdate) => {
    const { type } = classUpdate
    const aClass = await Class.findById(classId)
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found')
    }
    if (type === 'ADD-STUDENT') {
        aClass = { ...aClass, studentId: classUpdate.data }
    }
    if (type === 'UPDATE-CLASS') {
        Object.assign(aClass, classUpdate)
    }
    await aClass.save()
    return aClass
}


module.exports = {
    queryClasses,
    createClass,
    updateClass
}