const bcrypt = require('bcryptjs');
const { User } = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');

const createDefaultAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({
            $or: [
                { email: config.defaultAdmin.email },
                { role: 'admin' }
            ]
        });

        if (existingAdmin) {
            logger.info('Admin account already exists. Skipping creation.');
            return;
        }

        const hashedPassword = await bcrypt.hash(config.defaultAdmin.password, 8);

        const adminData = {
            name: config.defaultAdmin.name || 'System Administrator',
            email: config.defaultAdmin.email,
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const admin = await User.create(adminData);

        logger.info(`Default admin account created successfully:
      Email: ${admin.email}
      Password: ${config.defaultAdmin.password}
      Please change the password after first login!`);

    } catch (error) {
        logger.error('Error creating default admin account:', error);
        throw error;
    }
};

module.exports = createDefaultAdmin;