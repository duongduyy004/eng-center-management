const { uploadAvatarCloudinary, uploadBannerCloudinary } = require('../config/cloudinary');

const uploadSingle = uploadAvatarCloudinary.single('image');
const uploadBanner = uploadBannerCloudinary.single('image')

module.exports = { uploadSingle, uploadBanner };