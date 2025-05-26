const mongoose = require('mongoose');

const { toJSON, paginate, softDelete } = require('./plugins');

const studentSchema = new mongoose.Schema({
    discountPercentage: Number,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' }
},
    {
        timestamps: true,
    }
);

studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);
studentSchema.plugin(softDelete)

const Student = mongoose.model('Student', studentSchema)

module.exports = Student