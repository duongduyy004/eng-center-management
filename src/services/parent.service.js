const httpStatus = require('http-status');
const { Parent, Student, User, Payment } = require("../models");
const ApiError = require('../utils/ApiError');
const { userService, studentService, emailService } = require('../services/');

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
    const parents = await Parent.paginate(filter, {
        ...options, populate: [
            { path: 'userId' },
            { path: 'studentIds', populate: { path: 'userId', select: 'name' }, select: 'userId' }
        ]
    });
    return parents;
};

const getParentById = async (id) => {
    const parent = await Parent.findById(id)
        .populate('userId')
        .populate({
            path: 'studentIds',
            populate: { path: 'userId', select: 'name email phoneNumber' }
        });
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

    await Student.findByIdAndUpdate(student.id, { $unset: { parentId: 1 } })
    await Parent.findByIdAndUpdate(parent.id, { $pull: { studentIds: student.id } })

    return { message: 'Child removed successfully' };
};


const getStudentData = async (studentIds) => {
    let studentData = []
    for (const studentId of studentIds) {
        const attendance = await studentService.getStudentAttendance(studentId)
        const payment = await Payment.findOne({ month: new Date().getMonth().toString(), studentId })
        if (!attendance || !payment) {
            continue
        }
        if (attendance.attendanceStats.absentSessions > 0 || payment.paidAmount <= payment.totalAmount) {
            studentData.push({
                name: attendance.student.name,
                asbent: attendance.attendanceStats.absentSessions,
                remainingAmount: payment?.remainingAmount,
                time: `tháng ${payment.month}/${payment.year}`
            })
        }
    }
    return studentData
}

const formatEmail = (studentData) => {
    if (!Array.isArray(studentData) || studentData.length === 0) {
        return '<p>Không có dữ liệu học viên.</p>';
    }

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return '0';

        // Convert to number if it's string
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        // Format with thousands separator
        return numAmount.toLocaleString('vi-VN');
    };

    const studentSections = studentData.map(student => {
        return `
      <div style="margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
        <h3>📢 Thông tin học viên: ${student.name} ${student.time}</h3>
        <table style="font-size: 16px;">
          <tr>
            <td><strong>👩‍🎓 Họ và tên học viên:</strong></td>
            <td>${student.name}</td>
          </tr>
          <tr>
            <td><strong>❌ Số buổi vắng mặt:</strong></td>
            <td>${student.asbent} buổi</td>
          </tr>
          <tr>
            <td><strong>💵 Học phí còn lại:</strong></td>
            <td style="padding: 10px; ${student.remainingAmount > 0 ? 'color: #ff6b6b; font-weight: bold;' : 'color: #4CAF50;'}">${formatCurrency(student.remainingAmount)} VNĐ</td>
          </tr>
        </table>
      </div>
    `;
    }).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>Thông báo từ Trung tâm Tiếng Anh</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; max-width: 800px; margin: auto; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; color: #2b4f81;">📢 Báo cáo tình hình học viên</h2>
        
        <p>Kính gửi quý phụ huynh,</p>
        <p>Trung tâm Tiếng Anh xin gửi đến quý phụ huynh thông tin cập nhật về tình hình học tập và học phí của các học viên như sau:</p>

        ${studentSections}

        <p>Vui lòng liên hệ trung tâm nếu cần hỗ trợ thêm.</p>

        <div style="margin-top: 30px; font-size: 14px; color: #777777;">
          <p><strong>Trung tâm Tiếng Anh ABC</strong></p>
          <p>📞 Hotline: 0123 456 789</p>
          <p>📧 Email: lienhe@trungtamabc.edu.vn</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return html;
}

const sendEmailToParent = async () => {
    const parents = await Parent.find().populate('userId');
    const subject = 'Thông báo tình trạng học tập'
    let totalEmailSent = 0
    for (const parent of parents) {
        const studentData = await getStudentData(parent.studentIds)
        if (studentData.length === 0) continue;
        const html = formatEmail(studentData)
        await emailService.sendEmail(parent.userId.email, subject, html)
        totalEmailSent++
    }
    return totalEmailSent;
}

module.exports = {
    createParent,
    queryParents,
    getParentById,
    updateParentById,
    deleteParentById,
    addChild,
    deleteChild,
    sendEmailToParent
}