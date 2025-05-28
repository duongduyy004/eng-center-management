const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Types.ObjectId, ref: 'Student', required: true },
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
    attendedLessons: {
        type: Number,
        default: 0
    },
    feePerLesson: {
        type: Number,
        required: true
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    paymentDate: Date,
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue'],
        default: 'pending'
    },
    notes: String,
    paymentHistory: [{
        amount: Number,
        date: Date,
        method: {
            type: String,
            enum: ['cash', 'bank_transfer', 'card'],
            default: 'cash'
        },
        note: String,
        receivedBy: { type: mongoose.Types.ObjectId, ref: 'User' }
    }]
},
    {
        timestamps: true,
    }
)

// Pre-save middleware to calculate amounts
paymentSchema.pre('save', function (next) {
    this.totalAmount = this.totalLessons * this.feePerLesson;
    this.discountAmount = (this.totalAmount * this.discountPercent) / 100;
    this.finalAmount = this.totalAmount - this.discountAmount;
    this.remainingAmount = this.finalAmount - this.paidAmount;

    // Update status based on payment
    if (this.paidAmount === 0) {
        this.status = 'pending';
    } else if (this.paidAmount < this.finalAmount) {
        this.status = 'partial';
    } else {
        this.status = 'paid';
    }

    next();
});

paymentSchema.plugin(toJSON)
paymentSchema.plugin(paginate);
paymentSchema.plugin(softDelete, { overrideMethods: true })

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment
