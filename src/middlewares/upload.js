const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/avatars');

const createUploadsDir = async () => {
    try {
        await fs.access(uploadsDir);
    } catch (error) {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
};

// Initialize uploads directory
createUploadsDir();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image files are allowed'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
});

/**
 * Process and resize uploaded image
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - Path to processed image
 */
const processImage = async (buffer, filename) => {
    const outputPath = path.join(uploadsDir, filename);

    await sharp(buffer)
        .resize(300, 300, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({
            quality: 80,
            progressive: true
        })
        .toFile(outputPath);

    return `/uploads/avatars/${filename}`;
};

/**
 * Upload single avatar middleware
 */
const uploadAvatar = upload.single('avatar');

/**
 * Process avatar after upload
 */
const processAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `avatar-${timestamp}-${randomString}.jpg`;

        // Process image
        const avatarPath = await processImage(req.file.buffer, filename);

        // Add processed image path to request
        req.avatarPath = avatarPath;

        next();
    } catch (error) {
        next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process image'));
    }
};

/**
 * Delete old avatar file
 * @param {string} avatarPath - Path to avatar file
 */
const deleteAvatar = async (avatarPath) => {
    try {
        if (avatarPath && !avatarPath.startsWith('http')) {
            const fullPath = path.join(__dirname, '../../', avatarPath);
            await fs.unlink(fullPath);
        }
    } catch (error) {
        console.error('Failed to delete old avatar:', error);
    }
};

module.exports = {
    uploadAvatar,
    processAvatar,
    deleteAvatar
};