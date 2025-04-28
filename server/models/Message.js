/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - chat
 *         - sender
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the message
 *         chat:
 *           type: string
 *           description: ID of the chat this message belongs to
 *         sender:
 *           type: string
 *           description: ID of the user who sent the message
 *         content:
 *           type: string
 *           description: Content of the message
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the message was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the message was last updated
 */
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    }
}, {timestamps: true});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;