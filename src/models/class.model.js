const mongoose = require('mongoose')
const { paginate, toJSON, softDelete } = require('./plugins');
const logger = require('../config/logger');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    grade: {
        type: String,
        required: true // Lớp 3, Lớp 4, etc.
    },
    section: {
        type: String,
        required: true // 3.1, 3.2, 3.3, etc.
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'closed'],
        default: 'upcoming'
    },
    schedule: {
        startDate: Date,
        endDate: Date,
        dayOfWeeks: [Number], // 0-6 (Sunday-Saturday)
        timeSlots: {
            startTime: String,
            endTime: String
        }
    },
    feePerLesson: {
        type: Number,
        required: true
    },
    maxStudents: {
        type: Number,
        required: true
    },
    teacherId: { type: mongoose.Types.ObjectId, ref: 'Teacher' },
    description: String,
    totalLessons: Number, // Tổng số buổi học dự kiến
    room: String
},
    {
        timestamps: true,
    }
)

classSchema.plugin(toJSON)
classSchema.plugin(paginate);
classSchema.plugin(softDelete, { overrideMethods: true })

// Pre-save middleware to update student status when class is closed
classSchema.pre('save', async function (next) {
    try {
        // Check if status field was modified and changed to 'closed'
        if (this.isModified('status') && this.status === 'closed') {
            logger.info(`Class ${this.name} status changed to closed. Updating students...`);

            // Import Student model (avoid circular dependency)
            const Student = mongoose.model('Student');

            // Find all students enrolled in this class
            const studentsInClass = await Student.find({
                'classes.classId': this._id,
                'classes.status': 'active'
            });

            logger.info(`Found ${studentsInClass.length} students to update for class ${this.name}`);

            // Update each student's class status to 'completed'
            const updatePromises = studentsInClass.map(async (student) => {
                // Find the specific class in student's classes array
                const classIndex = student.classes.findIndex(
                    classItem => classItem.classId.toString() === this._id.toString()
                );

                if (classIndex !== -1) {
                    student.classes[classIndex].status = 'completed';
                    await student.save();
                    logger.info(`Updated student ${student._id} class status to completed`);
                }
            });

            await Promise.all(updatePromises);
            logger.info(`Successfully updated all students for class ${this.name}`);
        }

        next();
    } catch (error) {
        logger.error('Error updating student statuses when class closed:', error);
        next(error);
    }
});
const Class = mongoose.model('Class', classSchema)

module.exports = Class