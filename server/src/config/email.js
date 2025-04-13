import nodemailer from 'nodemailer';
import config from './env.js';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        logger.error('SMTP connection error:', error);
    } else {
        logger.info('SMTP server is ready to take our messages');
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: config.EMAIL_FROM,
            to,
            subject,
            html
        });
        logger.info('Email sent:', info.messageId);
        return info;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw error;
    }
};

export default transporter; 