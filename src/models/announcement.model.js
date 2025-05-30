const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['new_class', 'general', 'promotion', 'event'],
        default: 'general'
    },
    displayType: {
        type: String,
        enum: ['popup', 'banner', 'notification'],
        default: 'banner'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'parents', 'students', 'teachers'],
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    imageUrl: String,
    relatedClassId: { type: mongoose.Types.ObjectId, ref: 'Class' }, // Nếu quảng cáo về lớp học
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
},
    {
        timestamps: true,
    }
)

announcementSchema.plugin(toJSON)
announcementSchema.plugin(paginate);
announcementSchema.plugin(softDelete, { overrideMethods: true })

const Announcement = mongoose.model('Announcement', announcementSchema)

module.exports = Announcement
