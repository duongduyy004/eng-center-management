const cron = require('node-cron');
const { classService, parentService } = require('../services');
const logger = require('../config/logger');

/**
 * Start the class status scheduler
 */
const startClassStatusScheduler = async () => {
    // Chạy mỗi ngày lúc 0:00 sáng
    cron.schedule('2 0 * * *', async () => {
        logger.info('Starting scheduled class status update...');

        try {
            const result = await classService.updateClassStatus();
            if (result.totalUpdated > 0) {
                logger.info(`Scheduled update completed: ${JSON.stringify(result)}`);
            } else {
                logger.info('Scheduled update completed: No classes needed status update');
            }
        } catch (error) {
            logger.error('Error in scheduled class status update:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    logger.info('Class status scheduler started successfully');
};

const startSendEmailScheduler = async () => {
    //Chạy mỗi lần vào 7:00 ngày 1 hàng tháng
    cron.schedule('0 7 1 * *', async () => {
        logger.info('Starting scheduled send email to parent...');

        try {
            const totalEmailSent = await parentService.sendEmailToParent()
            logger.info(`Email sent completed: ${totalEmailSent}`);
        } catch (error) {
            logger.error('Error in sent email to parents:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    })

    logger.info('Email send scheduler started successfully');
}

module.exports = {
    startClassStatusScheduler,
    startSendEmailScheduler
}