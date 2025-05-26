const mongoose = require('mongoose')
const { softDelete, toJSON } = require('./plugins')

const attendanceSchema = new mongoose.Schema({
    date: Date,
    classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
    attendance: [
        {
            studentId: { type: mongoose.Types.ObjectId, ref: 'Student' },
            isAbsent: Boolean
        }
    ]
},
    {
        timestamps: true,
    }
)

attendanceSchema.plugin(toJSON)
attendanceSchema.plugin(softDelete)

const Attendance = mongoose.model('Attendance', attendanceSchema)

module.exports = Attendance