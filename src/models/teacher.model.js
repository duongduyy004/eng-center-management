const mongoose = require('mongoose')
const { softDelete } = require('./plugins')

const teacherSchema = new mongoose.Schema({
    classes: [{ type: mongoose.Types.ObjectId, ref: 'Class' }],
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    wagePerLesson: Number
},
    {
        timestamps: true,
    }
)



const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = Teacher