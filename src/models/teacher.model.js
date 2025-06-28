const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const teacherSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    classes: [{ type: mongoose.Types.ObjectId, ref: 'Class' }],
    salaryPerLesson: {
        type: Number,
        required: true
    },
    qualifications: [String], // Bằng cấp, chứng chỉ
    specialization: [String], // Chuyên môn (tiếng Anh giao tiếp, IELTS, etc.)
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    paymentHistory: {
        amount: Number,
        date: Date,
        method: {
            type: String,
            enum: ['cash', 'bank_transfer'],
        },
        note: String,
    }
},
    {
        timestamps: true,
    }
)

teacherSchema.plugin(toJSON)
teacherSchema.plugin(paginate);
teacherSchema.plugin(softDelete, { overrideMethods: true })

const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = Teacher