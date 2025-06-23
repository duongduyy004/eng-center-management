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
    displayType: {
        type: String,
        enum: ['popup', 'banner', 'notification'],
        default: 'banner'
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdBy: mongoose.Types.ObjectId,
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
    }
)

// Indexes for better performance
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ priority: -1 });

announcementSchema.plugin(toJSON)
announcementSchema.plugin(paginate);

const Announcement = mongoose.model('Announcement', announcementSchema)

module.exports = Announcement
