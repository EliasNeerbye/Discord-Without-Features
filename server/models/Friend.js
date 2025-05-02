/**
 * @swagger
 * components:
 *   schemas:
 *     FriendRequest:
 *       type: object
 *       required:
 *         - requester
 *         - recipient
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the friend request
 *         requester:
 *           type: string
 *           description: ID of the user who sent the request
 *         recipient:
 *           type: string
 *           description: ID of the user who received the request
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           description: Status of the friend request
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the request was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was last updated
 */
const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

// Create a compound index to ensure uniqueness of requester-recipient pair
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Add additional indexes for efficient queries
friendSchema.index({ requester: 1, status: 1 });
friendSchema.index({ recipient: 1, status: 1 });

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;