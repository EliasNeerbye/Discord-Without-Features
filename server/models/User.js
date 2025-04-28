/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - authMethod
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         username:
 *           type: string
 *           description: The user's username
 *         authMethod:
 *           type: string
 *           enum: [local, google]
 *           description: Authentication method
 *         googleId:
 *           type: string
 *           description: Google ID for OAuth users
 *         avatarUrl:
 *           type: string
 *           description: URL to user's avatar
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    passwordHash: {
        type: String,
        select: false
    },
    authMethod: {
        type: String,
        enum: ["local", "google"],
        required: true,
        default: "local"
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    avatarUrl: String,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

module.exports = User;