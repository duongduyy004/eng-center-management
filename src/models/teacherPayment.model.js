const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const teacherPaymentSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Types.ObjectId, ref: 'Teacher', required: true },
    classes: [{
        _id: false,
        classId: { type: mongoose.Types.ObjectId, ref: 'Class', required: true },
        totalLessons: {
            type: Number,
            required: true
        },
    }],
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
    salaryPerLesson: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    totalAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    paymentHistory: {
        amount: Number,
        date: Date,
        method: {
            type: String,
            enum: ['cash', 'bank_transfer']
        },
        note: String
    }
},
    {
        timestamps: true,
    }
)

// Pre-save middleware to calculate amounts
teacherPaymentSchema.pre('save', function (next) {
    this.totalAmount = 0;
    this.classes.forEach(item => {
        this.totalAmount += this.salaryPerLesson * item.totalLessons
    })
    if (this.paidAmount === 0) {
        this.status = 'pending'
    } else if (this.paidAmount < this.totalAmount) {
        this.status = 'partial'
    } else {
        this.status = 'paid'
    }
    next();
});


teacherPaymentSchema.plugin(toJSON)
teacherPaymentSchema.plugin(paginate);
teacherPaymentSchema.plugin(softDelete, { overrideMethods: true })

const TeacherPayment = mongoose.model('TeacherPayment', teacherPaymentSchema)

module.exports = TeacherPayment
