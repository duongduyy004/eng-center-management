const mongoose = require('mongoose')
const { softDelete, toJSON, paginate } = require('./plugins')

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
    linkUrl: {
        type: String,
        trim: true
    },
    displayType: {
        type: String,
        enum: ['popup', 'banner', 'notification', 'carousel'],
        default: 'banner'
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
},
    {
        timestamps: true,
    }
)

// Indexes for better performance
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ priority: -1 });
announcementSchema.index({ tags: 1 });

announcementSchema.plugin(toJSON)
announcementSchema.plugin(paginate);
announcementSchema.plugin(softDelete, { overrideMethods: true })

const Announcement = mongoose.model('Announcement', announcementSchema)

module.exports = Announcement
