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