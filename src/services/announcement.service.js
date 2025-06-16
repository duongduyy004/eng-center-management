const httpStatus = require('http-status');
const { Announcement } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an announcement
 * @param {Object} announcementBody
 * @returns {Promise<Announcement>}
 */
const createAnnouncement = async (announcementBody) => {
    return await Announcement.create(announcementBody);
};

/**
 * Query for announcements
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAnnouncements = async (filter, options) => {
    return await Announcement.paginate(filter, options);
};

/**
 * Get announcement by id
 * @param {ObjectId} id
 * @returns {Promise<Announcement>}
 */
const getAnnouncementById = async (id) => {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }
    return announcement;
};

/**
 * Update announcement by id
 * @param {ObjectId} announcementId
 * @param {Object} updateBody
 * @returns {Promise<Announcement>}
 */
const updateAnnouncementById = async (announcementId, updateBody) => {
    const announcement = await getAnnouncementById(announcementId);
    Object.assign(announcement, updateBody);
    await announcement.save();
    return announcement;
};

/**
 * Delete announcement by id
 * @param {ObjectId} announcementId
 * @returns {Promise<Announcement>}
 */
const deleteAnnouncementById = async (announcementId) => {
    const announcement = await getAnnouncementById(announcementId);
    await announcement.delete();
    return announcement;
};


module.exports = {
    createAnnouncement,
    queryAnnouncements,
    getAnnouncementById,
    updateAnnouncementById,
    deleteAnnouncementById,
};
