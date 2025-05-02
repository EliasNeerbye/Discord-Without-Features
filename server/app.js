const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const passport = require("passport");

const openapi = require('./util/openapi');
const logger = require("./util/logger");
const config = require("./util/config");
const setupPassport = require("./util/passportConfig");

console.log(config)

const app = express();
const server = http.createServer(app);

mongoose.connect(config.MONGODB_URI).then(() => {
    logger("Connected to MongoDB", 2);
}).catch((error) => {
    logger(`Error connecting to MongoDB: ${error.message}`, 5);
    process.exit(1);
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

// Initialize Passport
app.use(passport.initialize());
setupPassport();

// Serve static files
app.use('/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

app.use('/api-docs', openapi.serve, openapi.setup);

const io = new Server(server, {
    cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

require("./sockets/handler")(io);

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger(err.message, 5);
    res.status(500).json({ message: "Something went wrong!", error: true });
});

server.listen(config.PORT, () => {
    logger(`Server is listening on port: ${config.PORT}`, 2);
    logger(`API Documentation available at http://localhost:${config.PORT}/api-docs`, 2);
});

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