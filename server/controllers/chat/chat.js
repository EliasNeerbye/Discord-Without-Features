const Chat = require("../../models/Chat");
const User = require("../../models/User");
const logger = require("../../util/logger");
const mongoose = require("mongoose");

const createChat = async (req, res) => {
    try {
        const { participants, type, name } = req.body;
        const userId = req.user.userId;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ message: "Invalid participants", error: true });
        }

        // Filter out any empty strings and validate each ID is a valid ObjectId
        const validParticipants = participants.filter(id => {
            if (!id || id.trim() === '') return false;
            return mongoose.Types.ObjectId.isValid(id);
        });

        if (validParticipants.length === 0) {
            return res.status(400).json({ message: "No valid participants provided", error: true });
        }

        if (type === "private" && validParticipants.length !== 1) {
            return res.status(400).json({ message: "Private chat must have exactly one participant", error: true });
        }

        const uniqueParticipants = [...new Set([userId, ...validParticipants])];
        const existingUsers = await User.find({ _id: { $in: uniqueParticipants } });
        
        if (existingUsers.length !== uniqueParticipants.length) {
            return res.status(400).json({ message: "One or more users not found", error: true });
        }

        if (type === "private") {
            const existingChat = await Chat.findOne({
                type: "private",
                participants: { $all: uniqueParticipants, $size: 2 }
            });

            if (existingChat) {
                return res.json(existingChat);
            }
        }

        const chat = new Chat({
            participants: uniqueParticipants,
            type: type || "private",
            name: type === "group" ? name : undefined,
            createdBy: userId,
            admins: type === "group" ? [userId] : undefined
        });

        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

const getChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await Chat.find({ participants: userId })
            .populate("participants", "-passwordHash")
            .sort("-updatedAt");
        res.json(chats);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

const updateChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { name, participants } = req.body;
        const userId = req.user.userId;

        // Validate chatId is a valid ObjectId
        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: "Invalid chat ID", error: true });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found", error: true });
        }

        if (chat.type !== "group") {
            return res.status(400).json({ message: "Can only update group chats", error: true });
        }

        if (!chat.admins.includes(userId)) {
            return res.status(403).json({ message: "Only admins can update group chat", error: true });
        }

        if (name) {
            chat.name = name;
        }

        if (participants && Array.isArray(participants)) {
            // Filter out any empty strings and validate each ID is a valid ObjectId
            const validParticipants = participants.filter(id => {
                if (!id || id.trim() === '') return false;
                return mongoose.Types.ObjectId.isValid(id);
            });

            if (validParticipants.length > 0) {
                chat.participants = [...new Set([...chat.participants, ...validParticipants])];
            }
        }

        await chat.save();
        res.json(chat);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

module.exports = { createChat, getChats, updateChat };