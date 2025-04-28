const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const getUser = require("../middleware/getUser");
const { createChat, getChats, updateChat } = require("../controllers/chat/chat");
const { sendMessage, getMessages } = require("../controllers/chat/message");

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
});

const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 60, // 60 messages per minute
});

// Chat routes
router.post("/", chatLimiter, getUser, createChat);
router.get("/", chatLimiter, getUser, getChats);
router.put("/:chatId", chatLimiter, getUser, updateChat);

// Message routes
router.post("/:chatId/messages", messageLimiter, getUser, sendMessage);
router.get("/:chatId/messages", chatLimiter, getUser, getMessages);

module.exports = router;