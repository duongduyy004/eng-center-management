const mongoose = require('mongoose');
const { softDelete, toJSON, paginate } = require('./plugins');

const parentSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    canSeeTeacherInfo: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
    }
);

parentSchema.plugin(toJSON)
parentSchema.plugin(paginate);
parentSchema.plugin(softDelete, { overrideMethods: true })

const Parent = mongoose.model('Parent', parentSchema)

module.exports = Parent