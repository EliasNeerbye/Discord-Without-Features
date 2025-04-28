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