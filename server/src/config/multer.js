import multer from 'multer';
import path from 'path';
import config from './env.js';
import { createError } from '../utils/error.js';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = config.ALLOWED_FILE_TYPES.split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedTypes.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(createError(400, 'Loại file không được hỗ trợ'), false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: 5 // Maximum number of files
    }
});

export default upload; 