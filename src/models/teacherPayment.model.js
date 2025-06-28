const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const teacherPaymentSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Types.ObjectId, ref: 'Teacher', required: true },
    classId: { type: mongoose.Types.ObjectId, ref: 'Class', required: true },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    totalLessons: {
        type: Number,
        required: true
    },
    salaryPerLesson: {
        type: Number,
        required: true
    },
    totalAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    }
},
    {
        timestamps: true,
    }
)

// Pre-save middleware to calculate amounts
teacherPaymentSchema.pre('save', function (next) {
    this.totalAmount = this.totalLessons * this.salaryPerLesson;
    next();
});


teacherPaymentSchema.plugin(toJSON)
teacherPaymentSchema.plugin(paginate);
teacherPaymentSchema.plugin(softDelete, { overrideMethods: true })

const TeacherPayment = mongoose.model('TeacherPayment', teacherPaymentSchema)

module.exports = TeacherPayment
