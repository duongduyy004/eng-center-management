const httpStatus = require("http-status")
const { Parent } = require("../models")
const ApiError = require("../utils/ApiError")

const canSeeTeacher = () => async (req, res, next) => {
    try {
        const parent = await Parent.findOne({ userId: req.user.id });
        if (!parent) {
            next();
            return;
        }
        if (!parent.canSeeTeacherInfo) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Not allowed to see teacher information');
        }
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = canSeeTeacher