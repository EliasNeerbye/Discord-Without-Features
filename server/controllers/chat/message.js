const Message = require("../../models/Message");
const Chat = require("../../models/Chat");
const logger = require("../../util/logger");
const mongoose = require("mongoose");

const sendMessage = async (req, res) => {
    try {
        // Get chatId from either the route params or the request body
        const chatId = req.params.chatId || req.body.chatId;
        const { content } = req.body;
        const userId = req.user.userId;

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: "Invalid chat ID", error: true });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content is required", error: true });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found", error: true });
        }

        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ message: "Not a participant in this chat", error: true });
        }

        const message = new Message({
            chat: chatId,
            sender: userId,
            content: content.trim()
        });

        await message.save();
        
        // Update the chat's updatedAt timestamp
        chat.updatedAt = new Date();
        await chat.save();
        
        // Emit the new message to all participants in the chat room
        if (req.app && req.app.get('io')) {
            req.app.get('io').to(chatId).emit('newMessage', {
                ...message.toObject(),
                sender: { _id: userId }
            });
        }

        res.status(201).json(message);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { before } = req.query;
        const userId = req.user.userId;
        const limit = 50;

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: "Invalid chat ID", error: true });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found", error: true });
        }

        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ message: "Not a participant in this chat", error: true });
        }

        const query = { chat: chatId };
        
        // Improved timestamp handling
        if (before) {
            try {
                // Ensure the timestamp is slightly adjusted to account for millisecond precision
                const beforeDate = new Date(before);
                // Subtract 1 millisecond to ensure we don't exclude messages with the exact timestamp
                beforeDate.setMilliseconds(beforeDate.getMilliseconds() - 1);
                query.createdAt = { $lt: beforeDate };
                
                logger(`Fetching messages before: ${beforeDate.toISOString()}`, 2);
            } catch (err) {
                logger(`Invalid date format: ${before}`, 4);
                return res.status(400).json({ 
                    message: "Invalid date format. Use ISO date string (e.g. 2025-05-02T07:15:00.000Z)", 
                    error: true 
                });
            }
        }

        // Count total messages for pagination info
        const totalMessagesCount = await Message.countDocuments(query);
        
        const messages = await Message.find(query)
            .sort('-createdAt')
            .limit(limit)
            .populate('sender', '-passwordHash');

        // Return helpful pagination info
        res.json({
            messages,
            pagination: {
                total: totalMessagesCount,
                returned: messages.length,
                hasMore: totalMessagesCount > messages.length,
                oldestTimestamp: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
                newestTimestamp: messages.length > 0 ? messages[0].createdAt : null
            }
        });
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

module.exports = { sendMessage, getMessages };