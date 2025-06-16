const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'english-center/avatars',
        allowedFormats: ['jpg', 'png'],
        public_id: (req, file) => {
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            return `avatar-${timestamp}-${randomString}`;
        },
        transformation: [
            {
                width: 300,
                height: 300,
                crop: 'fill',
                gravity: 'face'
            }
        ]
    },
});

const uploadCloudinary = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image files are allowed'), false);
        }
    }
});

module.exports = {
    cloudinary,
    uploadCloudinary
};