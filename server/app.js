// NPM
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");

// Self Made
const logger = require("./util/logger");
const config = require("./util/config");

// --- Initialize App and Server ---
const app = express();
const server = http.createServer(app);

// --- Database Connection ---
mongoose.connect(config.MONGODB_URI).then(() => {
        logger("Connected to MongoDB", 2);
    }).catch((error) => {
        logger(`Error connecting to MongoDB: ${error.message}`, 5);
        process.exit(1);
    });

// --- Middleware Setup ---
app.use(helmet());
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

// --- Socket.IO Setup ---
const io = new Server(server, {
    cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

require("./sockets/handler")(io)

// --- Route Imports ---
const authRoutes = require("./routes/authRoutes");

// --- Routes ---
app.use("/api/auth", authRoutes);

// --- Server Startup ---
server.listen(config.PORT, () => {
    logger(`Server is listening on port: ${config.PORT}`, 2);
});

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
    logger('SIGTERM signal received: closing HTTP server', 2);
    server.close(() => {
        logger('HTTP server closed', 2);
        mongoose.disconnect().then(() => {
            logger('MongoDB connection closed', 2);
        process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger('SIGINT signal received: closing HTTP server', 2);
    server.close(() => {
        logger('HTTP server closed', 2);
        mongoose.disconnect().then(() => {
            logger('MongoDB connection closed', 2);
        process.exit(0);
        });
    });
});

module.exports = app;