const { cloudinary } = require("../config/cloudinary");
const logger = require("../config/logger");

const extractPublicIdFromUrl = (url) => {
    try {
        const regex = /\/([^\/]+\/[^\/]+\/[^\/]+)\.(?:jpg|jpeg|png|gif|webp)$/i;
        const match = url.match(regex);

        if (match) {
            return match[1]; // This includes the folder path
        }

        // Fallback: try to extract just the filename without extension
        const filenameMatch = url.match(/\/([^\/]+)\.[^\/]+$/);
        if (filenameMatch) {
            return `english-center/avatars/${filenameMatch[1]}`;
        }

        return null;
    } catch (error) {
        logger.error('Error extracting public ID from URL:', error);
        return null;
    }
};

const deleteImageFromCloudinary = async (avatarUrl) => {
    try {
        const publicId = extractPublicIdFromUrl(avatarUrl);
        if (publicId) {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result === 'ok') {
                logger.info(`Successfully deleted avatar with public ID: ${publicId}`);
            } else {
                logger.warn(`Failed to delete avatar with public ID: ${publicId}, result: ${result.result}`);
            }
        }
    } catch (error) {
        logger.error('Error deleting avatar from Cloudinary:', error);
        throw error;
    }
}

module.exports = {
    deleteImageFromCloudinary
}