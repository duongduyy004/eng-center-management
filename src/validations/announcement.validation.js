const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAnnouncement = {
    body: Joi.object().keys({
        title: Joi.string().required().trim(),
        content: Joi.string().required(),
        description: Joi.string().trim(),
        imageUrl: Joi.string().uri().trim(),
        linkUrl: Joi.string().uri().trim(),
        displayType: Joi.string().valid('popup', 'banner', 'notification', 'carousel').default('banner'),
        priority: Joi.number().integer().min(0).max(5).default(0),
        isActive: Joi.boolean().default(true),
        startDate: Joi.date().default(Date.now),
        endDate: Joi.date().greater(Joi.ref('startDate')),
        tags: Joi.array().items(Joi.string().trim())
    })
};

const getAnnouncements = {
    query: Joi.object().keys({
        title: Joi.string().trim(),
        displayType: Joi.string().valid('popup', 'banner', 'notification', 'carousel'),
        isActive: Joi.boolean(),
        priority: Joi.number().integer().min(0).max(5),
        tags: Joi.string().trim(),
        sortBy: Joi.string().valid(
            'createdAt:asc', 'createdAt:desc',
            'title:asc', 'title:desc',
            'priority:asc', 'priority:desc',
            'startDate:asc', 'startDate:desc',
            'viewCount:asc', 'viewCount:desc',
            'clickCount:asc', 'clickCount:desc'
        ),
        limit: Joi.number().integer().min(1).max(100),
        page: Joi.number().integer().min(1)
    })
};

const getAnnouncement = {
    params: Joi.object().keys({
        announcementId: Joi.string().custom(objectId)
    })
};

const updateAnnouncement = {
    params: Joi.object().keys({
        announcementId: Joi.string().custom(objectId)
    }),
    body: Joi.object().keys({
        title: Joi.string().trim(),
        content: Joi.string(),
        description: Joi.string().trim(),
        imageUrl: Joi.string().uri().trim(),
        linkUrl: Joi.string().uri().trim(),
        displayType: Joi.string().valid('popup', 'banner', 'notification', 'carousel'),
        priority: Joi.number().integer().min(0).max(5),
        isActive: Joi.boolean(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        tags: Joi.array().items(Joi.string().trim())
    })
};

const deleteAnnouncement = {
    params: Joi.object().keys({
        announcementId: Joi.string().custom(objectId)
    })
};

const getActiveAnnouncements = {
    query: Joi.object().keys({
        displayType: Joi.string().valid('popup', 'banner', 'notification', 'carousel'),
        tags: Joi.string().trim(),
        limit: Joi.number().integer().min(1).max(50).default(10)
    })
};

const incrementView = {
    params: Joi.object().keys({
        announcementId: Joi.string().custom(objectId)
    })
};

const incrementClick = {
    params: Joi.object().keys({
        announcementId: Joi.string().custom(objectId)
    })
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getActiveAnnouncements,
    incrementView,
    incrementClick
};
