import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '../../public');
const uploadsDir = path.join(publicPath, 'uploads/avatars');

// Create the uploads directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
};

// Create necessary directories
console.log('Setting up upload directories...');
ensureDirectoryExists(publicPath);
ensureDirectoryExists(path.join(publicPath, 'uploads'));
ensureDirectoryExists(uploadsDir);

console.log('Upload directories setup complete!');
