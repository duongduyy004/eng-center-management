const mongoose = require('mongoose');
const { softDelete } = require('./plugins');

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



const Parent = mongoose.model('Parent', parentSchema)

module.exports = Parent