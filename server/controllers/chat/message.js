const Message = require("../../models/Message");
const Chat = require("../../models/Chat");
const logger = require("../../util/logger");

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Send a message to a chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat to send message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content of the message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized or not a chat participant
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get messages from a chat
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat to get messages from
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages created before this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not authorized or not a chat participant
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */

const sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const userId = req.user.userId;

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
        req.app.get('io').to(chatId).emit('newMessage', {
            ...message.toObject(),
            sender: { _id: userId }
        });

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

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found", error: true });
        }

        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ message: "Not a participant in this chat", error: true });
        }

        const query = { chat: chatId };
        if (before) {
            query.createdAt = { $lt: before };
        }

        const messages = await Message.find(query)
            .sort('-createdAt')
            .limit(limit)
            .populate('sender', '-passwordHash');

        res.json(messages);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

module.exports = { sendMessage, getMessages };