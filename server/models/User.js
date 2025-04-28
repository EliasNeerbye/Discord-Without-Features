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