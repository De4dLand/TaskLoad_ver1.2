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
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...")
    console.log(err.name, err.message)
    server.close(() => {
        process.exit(1)
    })
})

export default server

