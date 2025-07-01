const httpStatus = require("http-status");
const { Class, Student, Teacher } = require("../models");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

/**
 * Convert time string (HH:mm) to minutes since midnight
 * @param {string} timeString - Time in format "HH:mm" or "HH:mm:ss"
 * @returns {number} - Minutes since midnight
 */
const convertTimeToMinutes = (timeString) => {
    if (!timeString) return 0;

    try {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    } catch (error) {
        logger.warn(`Invalid time format: ${timeString}`);
        return 0;
    }
};

/**
 * Convert day numbers to day names
 * @param {Array} dayNumbers - Array of numbers (0=Sunday, 1=Monday, etc.)
 * @returns {string} - Comma-separated day names
 */
const getDayNames = (dayNumbers) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNumbers.map(num => dayNames[num] || `Day${num}`).join(', ');
};

const queryClasses = async (filter, options) => {
    const aClass = await Class.paginate(filter, {
        ...options, populate:
            { path: 'teacherId', populate: { path: 'userId', select: 'name email' }, select: 'userId' }
    });
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
    const aClass = await Class.findById(classId)
    if (!aClass) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found')
    }
    Object.assign(aClass, classUpdate)
    await aClass.save()
    return aClass
}

/**
 * Enroll students to a class
 * @param {ObjectId} classId
 * @param {Array} studentData - Array of {studentId, discountPercent}
 * @returns {Promise<Object>}
 */
const enrollStudentToClass = async (classId, studentData) => {
    // Ensure studentData is an array
    if (!Array.isArray(studentData)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student data must be an array');
    }

    if (studentData.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Student data array cannot be empty');
    }

    // Check if class exists and is active
    const classInfo = await getClassById(classId);
    if (!classInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    if (classInfo.status === 'closed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot enroll to a closed class');
    }

    // Validate class schedule data for conflict checking
    if (!classInfo.schedule || !classInfo.schedule.dayOfWeeks || !classInfo.schedule.timeSlots) {
        logger.warn(`Class ${classId} has incomplete schedule data, skipping schedule conflict validation`);
    } else {
        logger.info(`Target class schedule: Days ${getDayNames(classInfo.schedule.dayOfWeeks)}, Time ${classInfo.schedule.timeSlots.startTime}-${classInfo.schedule.timeSlots.endTime}`);
    }

    // Get current number of enrolled students
    const currentEnrolledCount = await Student.countDocuments({
        'classes.classId': classId,
        'classes.status': 'active'
    });

    // Check if adding all students would exceed class capacity
    if (currentEnrolledCount + studentData.length > classInfo.maxStudents) {
        throw new ApiError(httpStatus.BAD_REQUEST,
            `Cannot enroll ${studentData.length} students. Class capacity: ${classInfo.maxStudents}, Current enrolled: ${currentEnrolledCount}, Available slots: ${classInfo.maxStudents - currentEnrolledCount}`);
    }

    const results = [];

    // First, validate all students before enrolling any of them
    for (const item of studentData) {

        // Check if student exists
        const student = await Student.findById(item.studentId).populate({
            path: 'classes.classId',
            select: 'schedule name grade section'
        });
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, `Student with ID ${item.studentId} not found`);
        }

        // Check if student is already enrolled in this class
        const existingEnrollment = student.classes.find(
            c => c.classId && c.classId.toString() === classId.toString() && c.status === 'active'
        );

        if (existingEnrollment) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${item.studentId} is already enrolled in this class`);
        }

        // Check for schedule conflicts (only if target class has proper schedule)
        if (classInfo.schedule && classInfo.schedule.dayOfWeeks && classInfo.schedule.timeSlots) {
            const hasScheduleConflict = student.classes.some(enrollment => {
                if (enrollment.status !== 'active' || !enrollment.classId || !enrollment.classId.schedule) {
                    return false;
                }

                const existingSchedule = enrollment.classId.schedule;
                const newSchedule = classInfo.schedule;

                // Skip if either class doesn't have proper schedule data
                if (!existingSchedule.dayOfWeeks || !existingSchedule.timeSlots ||
                    !newSchedule.dayOfWeeks || !newSchedule.timeSlots) {
                    return false;
                }

                // Check if there's any overlapping day
                const hasOverlappingDay = existingSchedule.dayOfWeeks.some(day =>
                    newSchedule.dayOfWeeks.includes(day)
                );

                if (!hasOverlappingDay) {
                    return false; // No overlapping days, no conflict
                }

                // Check if time slots overlap
                const existingStart = convertTimeToMinutes(existingSchedule.timeSlots.startTime);
                const existingEnd = convertTimeToMinutes(existingSchedule.timeSlots.endTime);
                const newStart = convertTimeToMinutes(newSchedule.timeSlots.startTime);
                const newEnd = convertTimeToMinutes(newSchedule.timeSlots.endTime);

                // Check if time slots overlap
                const timeOverlap = (newStart < existingEnd && newEnd > existingStart);

                if (timeOverlap) {
                    return true;
                }

                return false;
            });

            if (hasScheduleConflict) {
                const conflictingClass = student.classes.find(enrollment => {
                    if (enrollment.status !== 'active' || !enrollment.classId || !enrollment.classId.schedule) {
                        return false;
                    }

                    const existingSchedule = enrollment.classId.schedule;
                    const newSchedule = classInfo.schedule;

                    if (!existingSchedule.dayOfWeeks || !existingSchedule.timeSlots ||
                        !newSchedule.dayOfWeeks || !newSchedule.timeSlots) {
                        return false;
                    }

                    const hasOverlappingDay = existingSchedule.dayOfWeeks.some(day =>
                        newSchedule.dayOfWeeks.includes(day)
                    );

                    if (hasOverlappingDay) {
                        const existingStart = convertTimeToMinutes(existingSchedule.timeSlots.startTime);
                        const existingEnd = convertTimeToMinutes(existingSchedule.timeSlots.endTime);
                        const newStart = convertTimeToMinutes(newSchedule.timeSlots.startTime);
                        const newEnd = convertTimeToMinutes(newSchedule.timeSlots.endTime);

                        return (newStart < existingEnd && newEnd > existingStart);
                    }
                    return false;
                });

                const conflictDetails = conflictingClass ? conflictingClass.classId : null;
                const conflictSchedule = conflictDetails ? conflictDetails.schedule : null;

                let errorMessage = `Student with ID ${item.studentId} has a schedule conflict. `;
                errorMessage += `Already enrolled in class "${conflictDetails?.name || 'Unknown'}" (${conflictDetails?.grade || 'N/A'}-${conflictDetails?.section || 'N/A'})`;

                if (conflictSchedule && conflictSchedule.dayOfWeeks && conflictSchedule.timeSlots) {
                    const overlappingDays = conflictSchedule.dayOfWeeks.filter(day =>
                        classInfo.schedule.dayOfWeeks && classInfo.schedule.dayOfWeeks.includes(day)
                    );

                    errorMessage += ` which has overlapping schedule: `;
                    errorMessage += `Days: ${getDayNames(overlappingDays)}, `;
                    errorMessage += `Time: ${conflictSchedule.timeSlots.startTime}-${conflictSchedule.timeSlots.endTime}`;
                } else {
                    errorMessage += ` which has overlapping days and time slots with the new class.`;
                }

                throw new ApiError(httpStatus.CONFLICT, errorMessage);
            }
        }
    }

    for (const item of studentData) {
        try {
            // Add student to class
            const enrollmentInfo = {
                classId: classId,
                discountPercent: item.discountPercent || 0,
                enrollmentDate: new Date(),
                status: 'active'
            };

            const updatedStudent = await Student.findByIdAndUpdate(
                item.studentId,
                { $push: { classes: enrollmentInfo } },
                { new: true, populate: { path: 'userId', select: 'name email phone' } }
            );

            results.push({
                studentId: item.studentId,
                studentName: updatedStudent.userId?.name || 'N/A',
                discountPercent: item.discountPercent || 0,
                enrollmentDate: enrollmentInfo.enrollmentDate,
                status: 'enrolled'
            });

        } catch (error) {
            logger.error(`Error enrolling student ${item.studentId}:`, error);
            // If any enrollment fails after validation, throw error immediately
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to enroll student ${item.studentId}: ${error.message}`);
        }
    }

    return {
        id: classInfo._id,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
        year: classInfo.year,
        maxStudents: classInfo.maxStudents,
        currentEnrolled: currentEnrolledCount + results.length,
        successfulCount: results.length
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
    };

    // Get students using pagination
    const studentsResult = await Student.findWithDeleted(filter).populate('userId');

    // Transform student data to include class-specific info
    const studentsWithClassInfo = studentsResult.map(student => {
        const classEnrollment = student.classes.find(
            c => c.classId.toString() === classId.toString()
        );

        return {
            id: student.id || student._id,
            name: student.userId?.name || 'N/A',
            email: student.userId?.email || 'N/A',
            phone: student.userId?.phone || 'N/A'
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
            status: classInfo.status,
            teacher: classInfo.teacherId
        },
        students: studentsWithClassInfo,
        totalStudents: studentsWithClassInfo.length
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

const updateClassStatus = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison

    let updatedClasses = {
        upcomingToActive: 0,
        activeToClosing: 0,
        totalUpdated: 0
    };

    try {
        const upcomingClasses = await Class.find({
            status: 'upcoming',
            'schedule.startDate': { $gte: today }
        })

        for (const classDoc of upcomingClasses) {
            classDoc.status = 'active';
            classDoc.updatedAt = new Date();
            await classDoc.save();
            updatedClasses.upcomingToActive++;

            logger.info(`Class ${classDoc.name} (${classDoc.grade}-${classDoc.section}) status updated from upcoming to active`);
        }

        const activeClasses = await Class.find({
            status: 'active',
            'schedule.endDate': { $lte: today }
        });

        for (const classDoc of activeClasses) {
            // Count students before closing the class
            const studentsInClass = await Student.countDocuments({
                'classes.classId': classDoc._id,
                'classes.status': { $in: ['active', 'upcoming'] }
            });

            classDoc.status = 'closed';
            classDoc.updatedAt = new Date();
            await classDoc.save();

            updatedClasses.activeToClosing++;
            updatedClasses.studentsUpdated += studentsInClass;

            logger.info(`Class ${classDoc.name} (${classDoc.grade}-${classDoc.section}) status updated from active to closed. ${studentsInClass} students marked as completed.`);
        }

        updatedClasses.totalUpdated = updatedClasses.upcomingToActive + updatedClasses.activeToClosing;

        if (updatedClasses.totalUpdated > 0) {
            logger.info(`Class status update completed: ${updatedClasses.upcomingToActive} upcoming→active, ${updatedClasses.activeToClosing} active→closed`);
        }

        return updatedClasses;

    } catch (error) {
        logger.error('Error updating class statuses:', error);
        throw error;
    }
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
    unassignTeacherFromClass,
    updateClassStatus
}