const httpStatus = require('http-status');
const { Parent, Student, User, Attendance, Payment } = require("../models");
const ApiError = require('../utils/ApiError');
const { userService } = require('.');

const createParent = async (userData, parentData) => {
    const user = await userService.createUser({ ...userData, role: 'parent' });
    const parent = await Parent.create({ ...parentData, userId: user.id });
    return await parent.populate('userId');
}

const queryParents = async (filter, options) => {
    if (filter.name) {
        const users = await User.find({
            name: { $regex: filter.name, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        filter.userId = { $in: userIds };
        delete filter.name;
    }
    const parents = await Parent.paginate(filter, { ...options, populate: 'userId' });
    return parents;
};

const getParentById = async (id) => {
    const parent = Parent.findById(id).populate('userId');
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    return parent;
};

/**
 * 
 * @param {ObjectId} parentId 
 * @param {Object} updateBody 
 * @param {Object} [updateBody.userData]
 * @param {Object} [updateBody.parentData]
 * @returns 
 */
const updateParentById = async (parentId, updateBody, user) => {
    const { userData, parentData } = updateBody;
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    await userService.updateUserById(parent.userId, { ...userData, role: 'parent' })
    if (user.role !== 'admin') {
        delete parentData
    }
    Object.assign(parent, parentData);
    await parent.save();
    return parent;
};

const deleteParentById = async (parentId) => {
    const parent = await getParentById(parentId);
    await userService.deleteUserById(parent.userId)
    await parent.delete();
    return parent;
};

const addChild = async (parentId, studentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Check if student already has a parent
    if (student.parentId) {
        // If student already belongs to this parent
        if (student.parentId.toString() === parentId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Student already added to this parent');
        }
        // If student belongs to another parent
        const existingParent = await Parent.findById(student.parentId).populate('userId', 'name');
        const parentName = existingParent ? existingParent.userId.name : 'another parent';
        throw new ApiError(httpStatus.BAD_REQUEST, `Student already belongs to ${parentName}`);
    }

    // Double check in parent's studentIds array (redundant but safe)
    const isAlreadyInParent = parent.studentIds.find(item => item.toString() === studentId);
    if (isAlreadyInParent) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student already added to this parent');
    }

    // Update student's parentId
    student.parentId = parentId;
    parent.studentIds.push(student.id)
    await student.save();
    await parent.save();

    return { message: 'Child added successfully', student };
};

const deleteChild = async (parentId, studentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const student = await Student.findById(studentId);
    if (!student.parentId || student?.parentId.toString() !== parentId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Child not found or not associated with this parent');
    }

    student.parentId = null;
    parent.studentIds = parent.studentIds.filter(item => item.toString() !== studentId)
    await student.save();
    await parent.save();

    return { message: 'Child removed successfully' };
};

module.exports = {
    createParent,
    queryParents,
    getParentById,
    updateParentById,
    deleteParentById,
    addChild,
    deleteChild,
}