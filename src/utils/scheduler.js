const cron = require('node-cron');
const https = require('https');
const { classService, parentService } = require('../services');
const logger = require('../config/logger');
const config = require('../config/config');

//Update class status scheduler
const startClassStatusScheduler = async () => {
    // Trigger at 0:00 AM everyday
    cron.schedule('0 0 * * *', async () => {
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

//Auto send email to parent scheduler
const startSendEmailScheduler = async () => {
    // Trigger at 7:00 AM on 1st every month
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

const pingServerScheduler = async () => {
    // Trigger every 14 minutes
    cron.schedule('*/14 * * * *', async () => {
        try {
            await pingServer();
        } catch (error) {
        }
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    logger.info('Server ping scheduler started successfully - pinging every 14 minutes');
};

const pingServer = () => {
    const url = process.env.BACKEND_URL;
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode === 200) {
                resolve({
                    statusCode: 200,
                    body: 'Server pinged successfully',
                });
            } else {
                reject(
                    new Error(`Server ping failed with status code: ${res.statusCode}`)
                );
            }
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
};

module.exports = {
    startClassStatusScheduler,
    startSendEmailScheduler,
    pingServerScheduler
}