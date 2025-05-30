const httpStatus = require('http-status');
const { Parent, Student, User, Attendance, Payment } = require("../models");
const ApiError = require('../utils/ApiError');

const createParent = async (userData, parentData) => {
    // Support both new structured format and legacy format
    if (parentData) {
        // New structured format with separate userData and parentData
        const user = await User.create({ ...userData, role: 'parent' });
        const parent = await Parent.create({
            ...parentData,
            userId: user.id
        });
        return parent;
    } else {
        // Legacy format - userData contains all data
        return await Parent.create(userData);
    }
}

const queryParents = async (filter, options) => {
    const parents = await Parent.paginate(filter, options);
    return parents;
};

const getParentById = async (id) => {
    return Parent.findById(id).populate('userId').populate('children');
};

const updateParentById = async (parentId, updateBody) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    Object.assign(parent, updateBody);
    await parent.save();
    return parent;
};

const deleteParentById = async (parentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }
    await parent.remove();
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

    // Update student's parentId
    student.parentId = parentId;
    await student.save();

    return { message: 'Child added successfully', student };
};

const removeChild = async (parentId, studentId) => {
    const parent = await getParentById(parentId);
    if (!parent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Parent not found');
    }

    const student = await Student.findById(studentId);
    if (!student || student.parentId.toString() !== parentId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Child not found or not associated with this parent');
    }

    // Remove parent association
    student.parentId = null;
    await student.save();

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
    removeChild,
    getChildAttendanceReport
}