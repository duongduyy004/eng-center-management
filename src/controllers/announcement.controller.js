const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { announcementService } = require('../services');

const createAnnouncement = catchAsync(async (req, res) => {
    const announcementBody = { ...req.body, createdBy: req.user.id };
    const announcement = await announcementService.createAnnouncement(announcementBody);
    res.status(httpStatus.CREATED).json({
        message: 'Announcement created successfully',
        data: announcement
    });
});

const getAnnouncements = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['title', 'displayType', 'isActive', 'priority', 'tags']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    // Handle tags filter
    if (filter.tags) {
        filter.tags = { $in: filter.tags.split(',') };
    }

    const result = await announcementService.queryAnnouncements(filter, options);
    res.send({
        message: 'Announcements retrieved successfully',
        data: result
    });
});

const getAnnouncement = catchAsync(async (req, res) => {
    const announcement = await announcementService.getAnnouncementById(req.params.announcementId);
    res.send({
        message: 'Announcement retrieved successfully',
        data: announcement
    });
});

const updateAnnouncement = catchAsync(async (req, res) => {
    const announcement = await announcementService.updateAnnouncementById(req.params.announcementId, req.body);
    res.send({
        message: 'Announcement updated successfully',
        data: announcement
    });
});

const deleteAnnouncement = catchAsync(async (req, res) => {
    await announcementService.deleteAnnouncementById(req.params.announcementId);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
};
