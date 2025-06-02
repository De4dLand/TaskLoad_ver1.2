import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { errorHandler } from '../middlewares/error.js';
import routes from '../api/v1/routes/index.js';

export default async (app) => {
    // Security middleware
    app.use(helmet());

    // CORS configuration
    app.use(cors({
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_URL
            : 'http://localhost:5173', // Port mặc định của Vite
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('combined', { stream: logger.stream }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, // minutes
        max: config.RATE_LIMIT_MAX, // limit each IP to max requests per windowMs
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
    });
    app.use('/api/', limiter);

    // API routes
    app.use(`/api/${config.API_VERSION}`, routes);
    const version = config.API_VERSION;
    // Error handling
    app.use(errorHandler);

    // 404 handler
    app.use((req, res, next) => {
        res.status(404).json({
            status: 'error',
            message: 'Không tìm thấy tài nguyên',
            version: { version },

        });
    });

    logger.info('Express configured');
};
