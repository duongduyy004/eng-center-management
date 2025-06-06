const mongoose = require('mongoose')
const { paginate, toJSON, softDelete } = require('./plugins')

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
            startTime: String, // "08:00"
            endTime: String    // "10:00"
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
    currentStudents: {
        type: Number,
        default: 0
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

const Class = mongoose.model('Class', classSchema)

module.exports = Class