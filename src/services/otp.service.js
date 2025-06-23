const otpGenerator = require('otp-generator');
const { OTP, User } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const sendOTP = async (email) => {
    const user = await User.findOne({ email });

    // if (!user) {
    //     throw new ApiError(httpStatus.NOT_FOUND, 'No account found with this email address');
    // }

    let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });

    let result = await OTP.findOne({ otp: otp });
    while (result) {
        otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
        });
        result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    return otp
};

/**
 * Verify OTP for password reset
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (email, otp) => {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    return true;
};

module.exports = {
    sendOTP,
    verifyOTP
}