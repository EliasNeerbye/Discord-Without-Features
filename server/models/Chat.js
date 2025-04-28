/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       required:
 *         - participants
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the chat
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs participating in the chat
 *         type:
 *           type: string
 *           enum: [group, private]
 *           description: Type of chat (group or private)
 *         name:
 *           type: string
 *           description: Name of the chat (usually for group chats)
 *         createdBy:
 *           type: string
 *           description: User ID of the chat creator
 *         admins:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are admins of the group chat
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was last updated
 */
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    type: {
        type: String,
        required: true,
        enum: ["group", "private"],
        default: "private"
    },
    name: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }]
}, {timestamps: true});

chatSchema.index({ participants: 1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;