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
    totalAmount: Number,
    discountAmount: {
        type: Number,
        default: 0
    },
    finalAmount: Number,
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
    note: String,
    paymentHistory: [{
        _id: false,
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        },
        method: {
            type: String,
            enum: ['cash', 'bank_transfer', 'card'],
            default: 'cash'
        },
        note: String
    }]
},
    {
        timestamps: true,
    }
)

// Enhanced pre-save middleware with better logging
paymentSchema.pre('save', function (next) {
    // Calculate amounts
    this.totalAmount = this.attendedLessons * this.feePerLesson;
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

// Add pre-update middleware for findOneAndUpdate operations
paymentSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
    const update = this.getUpdate();
    // If any calculation-relevant fields are being updated
    if (update.totalLessons || update.feePerLesson || update.discountPercent || update.paidAmount) {
    }

    next();
});

paymentSchema.plugin(toJSON)
paymentSchema.plugin(paginate);
paymentSchema.plugin(softDelete, { overrideMethods: true })

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment
