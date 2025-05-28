const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const enrollmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class', required: true },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'withdrawn'],
        default: 'pending'
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountReason: String, // Lý do giảm giá (quen biết, học sinh cũ, etc.)
    approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    approvedDate: Date,
    withdrawalDate: Date,
    withdrawalReason: String,
    notes: String
},
    {
        timestamps: true,
    }
)

// Index để đảm bảo một học sinh chỉ đăng ký một lần cho một lớp
enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true })

enrollmentSchema.plugin(toJSON)
enrollmentSchema.plugin(paginate);
enrollmentSchema.plugin(softDelete, { overrideMethods: true })

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)

module.exports = Enrollment
