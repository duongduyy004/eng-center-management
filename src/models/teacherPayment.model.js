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
    paidAmount: {
        type: Number,
        default: 0
    },
    paymentDate: Date,
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
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

// Pre-save middleware to calculate amounts
teacherPaymentSchema.pre('save', function (next) {
    this.totalAmount = this.totalLessons * this.salaryPerLesson;
    this.paidAmount = this.paymentHistory.amount

    // Update status based on payment
    if (this.paidAmount === 0) {
        this.status = 'pending';
    } else {
        this.status = 'paid';
    }

    next();
});

teacherPaymentSchema.plugin(toJSON)
teacherPaymentSchema.plugin(paginate);
teacherPaymentSchema.plugin(softDelete, { overrideMethods: true })

const TeacherPayment = mongoose.model('TeacherPayment', teacherPaymentSchema)

module.exports = TeacherPayment
