import express from "express"
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import mongoSanitize from "express-mongo-sanitize"
import hpp from "hpp"
import dotenv from "dotenv"

// Get the current file's directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
dotenv.config({ path: join(__dirname, '../../shared/.env') });

// Import loaders
import loaders from "./loaders/index.js"

// Initialize app
const app = express()

// Initialize all loaders
try {
    await loaders(app);
    console.log('All loaders initialized successfully');
} catch (err) {
    console.error('Error initializing loaders:', err);
    process.exit(1);
}

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Prevent parameter pollution
app.use(hpp())

// Serve static files from the public directory
const publicPath = join(__dirname, '../../public');
app.use('/uploads', express.static(publicPath, {
  setHeaders: (res, path) => {
    // Set proper cache headers for uploaded files
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Ensure the uploads directory exists
import fs from 'fs';

const ensureDirectoryExists = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

// Create necessary directories
const uploadsDir = join(publicPath, 'uploads/avatars');
ensureDirectoryExists(uploadsDir);

// Serve static assets in production
app.use(express.static(join(__dirname, "../../client/dist")))

app.get("*", (req, res) => {
    res.sendFile(resolve(__dirname, "../../client/dist", "index.html"))
})


// Start server
const PORT = process.env.PORT || 5000 // Changed to port 5000 to avoid conflicts

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Initialize Socket.IO using the socket loader
const io = await app.locals.initializeSocketIO(server);

// Socket.IO is now configured with the following features:
// - Real-time chat system with typing indicators and read receipts
// - Notification system for task updates and project activities
// - Time tracking for tasks and projects
// - User presence tracking (online/offline status)
// - Comment system for tasks
// - Deadline warnings

export { io }

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...")
    console.log(err.name, err)
    server.close(() => {
        process.exit(1)
    })
})

export default server

