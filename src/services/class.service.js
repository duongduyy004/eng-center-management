const httpStatus = require("http-status");
const { Class, Student, Teacher } = require("../models");
const ApiError = require("../utils/ApiError");

const queryClasses = async (filter, options) => {
    const aClass = await Class.paginate(filter, options);
    return aClass;
}

const isClassExist = async (grade, section, year) => {
    const aClass = await Class.findOne({ grade, section, year })
    return aClass
}

const getClassById = async (classId) => {
    const aClass = await Class.findById(classId)
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found')
    }
    return aClass;
}

/**
 * Create a class
 * @param {Object} classBody
 * @returns {Promise<Class>}
 */
const createClass = async (classBody) => {
    if (classBody && await isClassExist(classBody?.grade, classBody?.section, classBody?.year) !== null) {
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
    Object.assign(aClass, classUpdate)
    await aClass.save()
    return aClass
}

/**
 * Enroll student to a class
 * @param {ObjectId} classId
 * @param {ObjectId} studentData
 * @returns {Promise<Object>}
 */
const enrollStudentToClass = async (classId, studentData) => {

    // Check if class exists and is active
    const classInfo = await getClassById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    if (classInfo.status === 'closed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot enroll to a closed class');
    }

    // Check if class has available slots
    if (classInfo.currentStudents >= classInfo.maxStudents) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class is full');
    }

    // Check if student exists
    const student = await Student.findById(studentData.studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Check if student is already enrolled in this class
    const existingEnrollment = student.classes.find(
        c => {
            if (c.classId) {
                return c.classId.toString() === classId.toString() && c.status === 'active'
            }
        }
    );
    if (existingEnrollment) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student is already enrolled in this class');
    }

    // Add student to class
    const enrollmentInfo = {
        classId: classId,
        discountPercent: studentData.discountPercent || 0,
        enrollmentDate: new Date(),
        status: 'active'
    };

    await Student.findByIdAndUpdate(
        studentData.studentId,
        { $push: { classes: enrollmentInfo } },
        { new: true }
    );

    // Return updated student info
    const updatedStudent = await Student.findById(studentData.studentId)
        .populate('userId', 'name email phone')
        .populate('classes.classId', 'name grade section year');

    return {
        student: updatedStudent,
        enrollmentInfo,
        classInfo: {
            id: classInfo._id,
            name: classInfo.name,
            maxStudents: classInfo.maxStudents
        }
    };
};

/**
 * Get students list of a class
 * @param {ObjectId} classId
 * @param {Object} options - Query options (pagination, sorting)
 * @returns {Promise<Object>}
 */
const getClassStudents = async (classId, options = {}) => {
    // Verify class exists
    const classInfo = await getClassById(classId);

    // Build filter to find students enrolled in this class
    const filter = {
        'classes.classId': classId,
        'classes.status': 'active'
    };

    // Default options for pagination
    const queryOptions = {
        limit: options.limit || 10,
        page: options.page || 1,
        sortBy: options.sortBy || 'createdAt:desc', // Use default sort, will sort by lastname manually
        populate: 'userId,parentId'
    };

    // Get students using pagination
    const studentsResult = await Student.paginate(filter, queryOptions);

    // Transform student data to include class-specific info
    const studentsWithClassInfo = studentsResult.results.map(student => {
        const classEnrollment = student.classes.find(
            c => c.classId.toString() === classId.toString() && c.status === 'active'
        );

        return {
            id: student.id || student._id,
            name: student.userId?.name || 'N/A',
        };
    });

    // Sort students by lastname (case-insensitive)
    studentsWithClassInfo.sort((a, b) => {
        const lastNameA = a.name.split(' ').pop().toLowerCase();
        const lastNameB = b.name.split(' ').pop().toLowerCase();
        return lastNameA.localeCompare(lastNameB, 'vi');
    });

    return {
        class: {
            id: classInfo._id,
            name: classInfo.name,
            grade: classInfo.grade,
            section: classInfo.section,
            year: classInfo.year,
            maxStudents: classInfo.maxStudents,
            currentStudents: studentsWithClassInfo.length,
            teacher: classInfo.teacherId
        },
        students: studentsWithClassInfo,
        pagination: {
            page: studentsResult.page,
            limit: studentsResult.limit,
            totalPages: studentsResult.totalPages,
            totalResults: studentsResult.totalResults
        }
    };
};

/**
 * Remove student from class
 * @param {ObjectId} classId
 * @param {ObjectId} studentId
 * @returns {Promise<Object>}
 */
const removeStudentFromClass = async (classId, studentId) => {
    // Verify class exists
    const classInfo = await getClassById(classId);

    // Check if student exists and get student info
    const student = await Student.findById(studentId).populate('userId', 'name email phone');
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Check if student is enrolled in this class
    const classEnrollment = student.classes.find(
        c => c.classId.toString() === classId.toString() && c.status === 'active'
    );

    if (!classEnrollment) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student is not enrolled in this class');
    }

    // Remove the specific class enrollment completely from student's classes array
    await Student.findByIdAndUpdate(
        studentId,
        {
            $pull: {
                classes: {
                    classId: classId,
                    status: 'active'
                }
            }
        }
    );

    return {
        student: {
            id: student._id,
            name: student.userId?.name || 'N/A',
            email: student.userId?.email || 'N/A',
            phone: student.userId?.phone || 'N/A'
        },
        class: {
            id: classInfo._id,
            name: classInfo.name,
            grade: classInfo.grade,
            section: classInfo.section,
            year: classInfo.year
        },
        removalDate: new Date(),
        message: 'Student completely removed from class'
    };
};

/**
 * Assign teacher to class
 * @param {ObjectId} classId
 * @param {ObjectId} teacherId
 * @returns {Promise<Object>}
 */
const assignTeacherToClass = async (classId, teacherId) => {
    // Verify class exists
    const classInfo = await getClassById(classId);

    // Check if teacher exists and is active
    const teacher = await Teacher.findById(teacherId).populate('userId', 'name email phone');
    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
    }

    if (!teacher.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher is not active');
    }

    // Check if class already has a teacher assigned
    if (classInfo.teacherId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class already has a teacher assigned. Please unassign the current teacher first.');
    }

    // Assign teacher to class
    await Class.findByIdAndUpdate(classId, { teacherId: teacherId });

    // Add class to teacher's classes array if not already present
    if (!teacher.classes.includes(classId)) {
        await Teacher.findByIdAndUpdate(
            teacherId,
            { $addToSet: { classes: classId } }
        );
    }

    // Get updated class info with teacher details
    const updatedClass = await Class.findById(classId).populate('teacherId', 'userId salaryPerLesson qualifications specialization');

    return {
        class: {
            id: updatedClass._id,
            name: updatedClass.name,
            grade: updatedClass.grade,
            section: updatedClass.section,
            year: updatedClass.year,
            teacher: {
                id: teacher._id,
                name: teacher.userId?.name || 'N/A',
                email: teacher.userId?.email || 'N/A',
                phone: teacher.userId?.phone || 'N/A',
                salaryPerLesson: teacher.salaryPerLesson,
                qualifications: teacher.qualifications,
                specialization: teacher.specialization
            }
        },
        assignmentDate: new Date(),
        message: 'Teacher assigned to class successfully'
    };
};

/**
 * Unassign teacher from class
 * @param {ObjectId} classId
 * @returns {Promise<Object>}
 */
const unassignTeacherFromClass = async (classId) => {
    // Verify class exists
    const classInfo = await Class.findById(classId).populate('teacherId', 'userId');
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    // Check if class not has a teacher assigned
    if (!classInfo.teacherId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class does not have a teacher assigned');
    }

    const teacherId = classInfo.teacherId._id;

    // Remove teacher from class
    await Class.findByIdAndUpdate(classId, { $unset: { teacherId: 1 } });

    // Remove class from teacher's classes array
    const teacherInfo = await Teacher.findByIdAndUpdate(
        teacherId,
        { $pull: { classes: classId } }
    ).populate('userId');

    return {
        class: {
            id: classInfo._id,
            name: classInfo.name,
            grade: classInfo.grade,
            section: classInfo.section,
            year: classInfo.year
        },
        unassignedTeacher: {
            id: teacherId,
            name: teacherInfo.userId?.name || 'N/A'
        },
        unassignmentDate: new Date(),
        message: 'Teacher unassigned from class successfully'
    };
};

module.exports = {
    queryClasses,
    createClass,
    updateClass,
    getClassById,
    enrollStudentToClass,
    getClassStudents,
    removeStudentFromClass,
    assignTeacherToClass,
    unassignTeacherFromClass
}