const mongoose = require('mongoose')
const { paginate, toJSON, softDelete } = require('./plugins')

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    teacherId: { type: mongoose.Types.ObjectId, ref: 'Teacher' },
    studentIds: [{ type: mongoose.Types.ObjectId, ref: 'Student' }],
    attendanceId: { type: mongoose.Types.ObjectId, ref: 'Attendance' },
    schedule: {
        startDate: Date,
        endDate: Date,
        dayOfWeeks: [Number]
    },
    feePerLesson: Number
},
    {
        timestamps: true,
    }
)

classSchema.plugin(toJSON)
classSchema.plugin(paginate);
classSchema.plugin(softDelete)

const Class = mongoose.model('Class', classSchema)

module.exports = Class