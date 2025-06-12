const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const attendanceSchema = new mongoose.Schema({
    classId: { type: mongoose.Types.ObjectId, ref: 'Class', required: true },
    date: {
        type: Date,
        required: true
    },
    teacherId: { type: mongoose.Types.ObjectId, ref: 'Teacher', required: true },
    students: [
        {
            studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true },
            status: {
                type: String,
                enum: ['present', 'absent', 'late'],
                required: true,
                default: 'absent'
            },
            note: String,
            checkedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    isCompleted: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true,
    }
)

attendanceSchema.plugin(toJSON)
attendanceSchema.plugin(paginate);
attendanceSchema.plugin(softDelete, { overrideMethods: true })

const Attendance = mongoose.model('Attendance', attendanceSchema)

module.exports = Attendance