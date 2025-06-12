const httpStatus = require('http-status');
const { Parent, Student, User, Attendance, Payment } = require("../models");
const ApiError = require('../utils/ApiError');
const { userService } = require('.');

const createParent = async (userData, parentData) => {
    const user = await userService.createUser({ ...userData, role: 'parent' });
    const parent = await Parent.create({
        ...parentData,
        userId: user.id
    });
    return parent;
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

const getParentChildren = async (parentId) => {
    const parent = await Parent.findById(parentId).populate({
        path: 'children',
        populate: {
            path: 'userId classId',
            select: 'name email phone class'
        }
    });
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    return parent.children;
};

const getChildrenAttendance = async (parentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const children = await Student.find({ parentId }).populate('userId', 'name');
    const childrenIds = children.map(child => child._id);

    const attendance = await Attendance.find({
        studentId: { $in: childrenIds }
    }).populate('studentId classId', 'name');

    return attendance;
};

const getChildrenPayments = async (parentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const children = await Student.find({ parentId }).populate('userId', 'name');
    const childrenIds = children.map(child => child._id);

    const payments = await Payment.find({
        studentId: { $in: childrenIds }
    }).populate('studentId', 'name');

    return payments;
};

const getChildrenStats = async (parentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const children = await Student.find({ parentId }).populate('userId classId', 'name');
    const childrenIds = children.map(child => child._id);

    // Get attendance stats
    const totalClasses = await Attendance.countDocuments({
        studentId: { $in: childrenIds }
    });
    const presentClasses = await Attendance.countDocuments({
        studentId: { $in: childrenIds },
        status: 'present'
    });

    // Get payment stats
    const totalPayments = await Payment.countDocuments({
        studentId: { $in: childrenIds }
    });
    const paidPayments = await Payment.countDocuments({
        studentId: { $in: childrenIds },
        status: 'paid'
    });

    return {
        totalChildren: children.length,
        attendanceRate: totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0,
        paymentRate: totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0,
        children: children.map(child => ({
            id: child._id,
            name: child.userId.name,
            class: child.classId?.name || 'Not assigned'
        }))
    };
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
    console.log('check parent', parent)

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

const getChildAttendanceReport = async (parentId, studentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const student = await Student.findById(studentId).populate('userId', 'name');
    if (!student || student.parentId.toString() !== parentId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Child not found or not associated with this parent');
    }

    const attendance = await Attendance.find({ studentId })
        .populate('classId', 'name')
        .sort({ date: -1 });

    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present').length;
    const absentClasses = attendance.filter(a => a.status === 'absent').length;
    const lateClasses = attendance.filter(a => a.status === 'late').length;

    return {
        student: {
            id: student._id,
            name: student.userId.name
        },
        summary: {
            totalClasses,
            presentClasses,
            absentClasses,
            lateClasses,
            attendanceRate: totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0
        },
        records: attendance
    };
};

module.exports = {
    createParent,
    queryParents,
    getParentById,
    updateParentById,
    deleteParentById,
    getParentChildren,
    getChildrenAttendance,
    getChildrenPayments,
    getChildrenStats,
    addChild,
    deleteChild,
    getChildAttendanceReport
}