const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const statisticsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['monthly_revenue', 'student_count', 'teacher_payment', 'class_statistics'],
        required: true
    },
    period: {
        month: Number,
        year: Number,
        quarter: Number // 1, 2, 3, 4
    },
    data: {
        // Revenue statistics
        totalRevenue: Number,
        expectedRevenue: Number,
        collectedRevenue: Number,

        // Student statistics
        totalStudents: Number,
        newStudents: Number,
        withdrawnStudents: Number,
        activeStudents: Number,

        // Teacher payment statistics
        totalTeacherPayment: Number,
        paidTeacherPayment: Number,
        pendingTeacherPayment: Number,

        // Class statistics
        totalClasses: Number,
        activeClasses: Number,
        completedClasses: Number,

        // Detailed breakdown
        breakdown: [{
            classId: { type: mongoose.Types.ObjectId, ref: 'Class' },
            className: String,
            studentCount: Number,
            revenue: Number,
            teacherCost: Number,
            profit: Number
        }]
    },
    generatedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    generatedAt: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true,
    }
)

// Index để tối ưu truy vấn
statisticsSchema.index({ type: 1, 'period.year': 1, 'period.month': 1 })
statisticsSchema.index({ type: 1, 'period.year': 1, 'period.quarter': 1 })

statisticsSchema.plugin(toJSON)
statisticsSchema.plugin(paginate);
statisticsSchema.plugin(softDelete, { overrideMethods: true })

const Statistics = mongoose.model('Statistics', statisticsSchema)

module.exports = Statistics
