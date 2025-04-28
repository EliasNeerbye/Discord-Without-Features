const logger = require("../util/logger");
const { verifyJwt } = require("../util/jwtHandler");
const User = require("../models/User");
const Chat = require("../models/Chat");

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1];
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = verifyJwt(token);
            if (!decoded) {
                return next(new Error('Invalid token'));
            }

            const user = await User.findById(decoded.userId).select('-passwordHash');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(error);
        }
    });

    io.on("connection", async (socket) => {
        logger(`User ${socket.user._id} connected`, 1);

        // Join user's chat rooms
        const userChats = await Chat.find({ participants: socket.user._id });
        userChats.forEach(chat => {
            socket.join(chat._id.toString());
        });

        socket.on("joinChat", async (chatId) => {
            try {
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: socket.user._id
                });

                if (chat) {
                    socket.join(chatId);
                    logger(`User ${socket.user._id} joined chat ${chatId}`, 1);
                }
            } catch (error) {
                logger(`Error joining chat: ${error.message}`, 5);
            }
        });

        socket.on("leaveChat", (chatId) => {
            socket.leave(chatId);
            logger(`User ${socket.user._id} left chat ${chatId}`, 1);
        });

        socket.on("typing", (chatId) => {
            socket.to(chatId).emit("userTyping", {
                chatId,
                userId: socket.user._id
            });
        });

        socket.on("stopTyping", (chatId) => {
            socket.to(chatId).emit("userStoppedTyping", {
                chatId,
                userId: socket.user._id
            });
        });

        socket.on("disconnect", () => {
            logger(`User ${socket.user._id} disconnected`, 1);
        });
    });
};