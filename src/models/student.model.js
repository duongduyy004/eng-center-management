const mongoose = require('mongoose');

const { toJSON, paginate, softDelete } = require('./plugins');

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    classes: [{
        classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active'
        }
    }]
},
    {
        timestamps: true,
    }
);

studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);
studentSchema.plugin(softDelete, { overrideMethods: true })

const Student = mongoose.model('Student', studentSchema)

module.exports = Student