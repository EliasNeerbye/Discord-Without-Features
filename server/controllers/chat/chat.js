const Chat = require("../../models/Chat");
const User = require("../../models/User");
const logger = require("../../util/logger");

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat management endpoints
 * 
 * /api/chats:
 *   post:
 *     summary: Create a new chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add to the chat
 *               type:
 *                 type: string
 *                 enum: [private, group]
 *                 description: Type of chat (defaults to private)
 *               name:
 *                 type: string
 *                 description: Name of the group chat (required for group chats)
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chats/{chatId}:
 *   put:
 *     summary: Update a group chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the group chat
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add to the chat
 *     responses:
 *       200:
 *         description: Chat updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Invalid input or not a group chat
 *       403:
 *         description: Not authorized or not an admin
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */

const createChat = async (req, res) => {
    try {
        const { participants, type, name } = req.body;
        const userId = req.user.userId;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ message: "Invalid participants", error: true });
        }

        if (type === "private" && participants.length !== 1) {
            return res.status(400).json({ message: "Private chat must have exactly one participant", error: true });
        }

        const uniqueParticipants = [...new Set([userId, ...participants])];
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

        if (participants) {
            chat.participants = [...new Set([...chat.participants, ...participants])];
        }

        await chat.save();
        res.json(chat);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

module.exports = { createChat, getChats, updateChat };