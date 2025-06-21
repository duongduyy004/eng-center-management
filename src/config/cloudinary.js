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

// Configure Cloudinary storage for avatars
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

// Configure Cloudinary storage for banners
const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'english-center/banners',
        allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => {
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            return `banner-${timestamp}-${randomString}`;
        }
    },
});

const uploadAvatarCloudinary = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image files are allowed'), false);
        }
    }
});

const uploadBannerCloudinary = multer({
    storage: bannerStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for banners
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError(httpStatus.BAD_REQUEST, 'Only JPEG, PNG, and WebP image files are allowed for banners'), false);
        }
    }
});


module.exports = {
    cloudinary,
    uploadBannerCloudinary,
    uploadAvatarCloudinary,
};