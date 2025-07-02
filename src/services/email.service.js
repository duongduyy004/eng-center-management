const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html = null) => {
  const msg = {
    from: `${config.email.displayName} <${config.email.from}>`,
    to,
    subject,
    ...(html && { html }) // Add HTML if provided
  };

  try {
    const result = await transport.sendMail(msg);
    logger.info(`Email sent successfully to ${to}: ${subject}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send reset password email with OTP
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, otp) => {
  const subject = 'Reset Password - OTP Code';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-code { background-color: #fff; border: 2px solid #4CAF50; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #4CAF50; margin: 20px 0; border-radius: 5px; letter-spacing: 3px; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <p>Dear User,</p>
                <p>We received a request to reset your password for your English Center Management account.</p>
                <p>Please use the following OTP code to complete your password reset:</p>
                
                <div class="otp-code">${otp}</div>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This OTP code will expire in <strong>10 minutes</strong></li>
                    <li>Do not share this code with anyone</li>
                    <li>If you did not request a password reset, please ignore this email</li>
                </ul>
                
                <div class="warning">
                    <p>⚠️ If you did not request this password reset, please contact our support team immediately.</p>
                </div>
            </div>
            <div class="footer">
                <p>Best regards,<br>English Center Management Team</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification - English Center Management';

  // Update this URL to match your frontend application
  const verificationEmailUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .verify-button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .verify-button:hover { background-color: #1976D2; }
            .link-text { background-color: #fff; border: 1px solid #ddd; padding: 10px; word-break: break-all; font-size: 12px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to English Center Management!</h1>
            </div>
            <div class="content">
                <p>Dear User,</p>
                <p>Thank you for registering with our English Center Management system.</p>
                <p>To complete your registration and verify your email address, please click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationEmailUrl}" class="verify-button">Verify Email Address</a>
                </div>
                
                <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <div class="link-text">${verificationEmailUrl}</div>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This verification link will expire in <strong>10 minutes</strong></li>
                    <li>If you did not create an account, please ignore this email</li>
                </ul>
            </div>
            <div class="footer">
                <p>Best regards,<br>English Center Management Team</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail
};
