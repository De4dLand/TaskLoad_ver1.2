import express from "express"
import { join, resolve } from "path"
import mongoSanitize from "express-mongo-sanitize"
import hpp from "hpp"
import dotenv from "dotenv"
import { fileURLToPath } from 'url'
import path from 'path'

// Load env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: join(__dirname, '../shared/.env') });

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

// Serve static assets in production

app.use(express.static(join(__dirname, "../../client/dist")))

app.get("*", (req, res) => {
    res.sendFile(resolve(__dirname, "../../client/dist", "index.html"))
})


// Start server
const PORT = process.env.PORT || 5001 // Changed to port 5001 to avoid conflicts
import { Server as SocketIOServer } from "socket.io"
import { emitDeadlineWarnings, handleCommentEvents } from "./socketTasks.js"

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Initialize Socket.IO with enhanced functionality
import initializeSocketIO from './socket/index.js';

// Set up Socket.IO with all handlers (chat, notifications, time tracking)
const io = initializeSocketIO(server);

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
    console.log(err.name, err.message)
    server.close(() => {
        process.exit(1)
    })
})

export default server

