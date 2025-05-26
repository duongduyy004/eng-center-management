const mongoose = require('mongoose')
const { softDelete, toJSON } = require('./plugins')

const teacherSchema = new mongoose.Schema({
    classes: [{ type: mongoose.Types.ObjectId, ref: 'Class' }],
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    wagePerLesson: Number,
    description: {
        type: String,
        required: true
    }
},
    {
        timestamps: true,
    }
)

teacherSchema.plugin(toJSON)
teacherSchema.plugin(softDelete)

const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = Teacher