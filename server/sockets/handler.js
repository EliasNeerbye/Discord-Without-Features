const logger = require("../util/logger");
const { verifyJwt } = require("../util/jwtHandler");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Friend = require("../models/Friend");

module.exports = (io) => {
    // Map to store user socket connections by userId
    const userSockets = new Map();

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
        const userId = socket.user._id.toString();
        logger(`User ${userId} connected`, 1);
        
        // Store the socket connection
        userSockets.set(userId, socket);

        // Join user's chat rooms
        const userChats = await Chat.find({ participants: userId });
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
                    logger(`User ${userId} joined chat ${chatId}`, 1);
                }
            } catch (error) {
                logger(`Error joining chat: ${error.message}`, 5);
            }
        });

        socket.on("leaveChat", (chatId) => {
            socket.leave(chatId);
            logger(`User ${userId} left chat ${chatId}`, 1);
        });

        socket.on("typing", (chatId) => {
            socket.to(chatId).emit("userTyping", {
                chatId,
                userId
            });
        });

        socket.on("stopTyping", (chatId) => {
            socket.to(chatId).emit("userStoppedTyping", {
                chatId,
                userId
            });
        });

        socket.on("disconnect", () => {
            userSockets.delete(userId);
            logger(`User ${userId} disconnected`, 1);
        });
    });

    // Middleware to handle friend request events
    // This gets called from the controllers
    return {
        emitFriendRequest: async (friendRequest) => {
            try {
                // Populate the requester and recipient fields
                const populatedRequest = await Friend.findById(friendRequest._id)
                    .populate('requester recipient', '_id username email avatarUrl');
                
                // Get the recipient's socket
                const recipientSocket = userSockets.get(populatedRequest.recipient._id.toString());
                
                if (recipientSocket) {
                    // Emit the friend request to the recipient
                    recipientSocket.emit('friendRequest', populatedRequest);
                }
                
                // Get the requester's socket
                const requesterSocket = userSockets.get(populatedRequest.requester._id.toString());
                
                if (requesterSocket) {
                    // Emit to the requester that the request was sent
                    requesterSocket.emit('friendRequestSent', populatedRequest);
                }
            } catch (error) {
                logger(`Error emitting friend request: ${error.message}`, 5);
            }
        },
        
        emitFriendRequestUpdate: async (friendRequest) => {
            try {
                // Populate the requester and recipient fields
                const populatedRequest = await Friend.findById(friendRequest._id)
                    .populate('requester recipient', '_id username email avatarUrl');
                
                // Get the requester's socket
                const requesterSocket = userSockets.get(populatedRequest.requester._id.toString());
                
                if (requesterSocket) {
                    // Emit the updated friend request to the requester
                    requesterSocket.emit('friendRequestUpdated', populatedRequest);
                }
            } catch (error) {
                logger(`Error emitting friend request update: ${error.message}`, 5);
            }
        }
    };
};