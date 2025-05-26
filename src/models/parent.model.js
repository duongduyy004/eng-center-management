const mongoose = require('mongoose');
const { softDelete, toJSON } = require('./plugins');

const parentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    canSeeTeacher: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
    }
);

parentSchema.plugin(toJSON)
parentSchema.plugin(softDelete)

const Parent = mongoose.model('Parent', parentSchema)

module.exports = Parent