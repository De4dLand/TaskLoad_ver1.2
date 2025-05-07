import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env file
dotenv.config({ path: path.join(__dirname, '../../../shared/.env') });

export default {
    // Server config
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    API_VERSION: process.env.API_VERSION || 'v1',

    // MongoDB config
    MONGODB_URI: process.env.VITE_MONGODB_URI,
    MONGODB_OPTIONS: {
        tls: false,
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    },

    // Redis config
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
    REDIS_DB: process.env.REDIS_DB || 0,

    // JWT config
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Email config
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@moretaskload.com',

    // File upload config
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5242880, // 5MB
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',

    // Rate limiting config
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15, // minutes
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100, // requests per window

    // Logging config
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

    // Cache config
    CACHE_TTL: process.env.CACHE_TTL || 3600, // 1 hour in seconds
};
