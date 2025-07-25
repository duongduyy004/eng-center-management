const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    DB_NAME: Joi.string().required().description('Database name is required'),
    DB_USER: Joi.string().required().description('Database username is required'),
    DB_PASSWORD: Joi.string().required().description('Database password is required'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    DEFAULT_ADMIN_EMAIL: Joi.string().email().default('admin@gmail.com'),
    DEFAULT_ADMIN_PASSWORD: Joi.string().min(6).default('admin123'),
    DEFAULT_ADMIN_NAME: Joi.string().default('Bố'),
    VNP_TMN_CODE: Joi.string(),
    VNP_HASH_SECRET: Joi.string(),
    VNP_URL: Joi.string(),
    VNP_API: Joi.string(),
    VNP_RETURN_URL: Joi.string()
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      dbName: envVars.DB_NAME,
      user: envVars.DB_USER,
      pass: envVars.DB_PASSWORD
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
    displayName: envVars.DISPLAY_NAME
  },
  // Default admin configuration
  defaultAdmin: {
    email: envVars.DEFAULT_ADMIN_EMAIL,
    password: envVars.DEFAULT_ADMIN_PASSWORD,
    name: envVars.DEFAULT_ADMIN_NAME,
  },
  vnpay: {
    vnp_TmnCode: envVars.VNP_TMN_CODE,
    vnp_HashSecret: envVars.VNP_HASH_SECRET,
    vnp_Url: envVars.VNP_URL,
    vnp_Api: envVars.VNP_API,
    vnp_ReturnUrl: envVars.VNP_RETURN_URL
  }
};
