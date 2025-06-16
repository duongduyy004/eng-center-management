const { uploadCloudinary } = require('../config/cloudinary');

const uploadSingle = uploadCloudinary.single('image');

module.exports = { uploadSingle };