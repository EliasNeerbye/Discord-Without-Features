const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp"); // Add sharp for image processing
const getUser = require("../middleware/getUser");
const { getProfile, updateProfile } = require("../controllers/user/profile");
const { searchUsers, getFriends, getFriendRequests, sendFriendRequest, updateFriendRequest } = require("../controllers/user/friend");
const User = require("../models/User");
const logger = require("../util/logger");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
});

// More strict rate limiter for friend requests to prevent spam
const friendRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
});

// Image processing configuration
const IMAGE_CONFIG = {
    maxWidth: 300,
    maxHeight: 300,
    quality: 80,
    format: 'jpeg'
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.files || !req.files.avatar) {
            return res.status(400).json({ message: "No avatar file uploaded", error: true });
        }

        const avatar = req.files.avatar;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(avatar.mimetype)) {
            return res.status(400).json({ message: "Invalid file type", error: true });
        }

        if (avatar.size > 10 * 1024 * 1024) { // Increased max size since we'll compress
            return res.status(400).json({ message: "File too large (max 10MB)", error: true });
        }

        const uploadDir = path.join(__dirname, '../uploads/avatars');
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${req.user.userId}-${Date.now()}.${IMAGE_CONFIG.format}`;
        const filepath = path.join(uploadDir, filename);
        
        // Process the image with sharp
        const tempPath = avatar.tempFilePath;
        
        await sharp(tempPath)
            .resize({
                width: IMAGE_CONFIG.maxWidth,
                height: IMAGE_CONFIG.maxHeight,
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: IMAGE_CONFIG.quality })
            .toFile(filepath);
            
        // Clean up the temp file
        await fs.unlink(tempPath).catch(() => {});

        const user = await User.findById(req.user.userId);
        if (user.avatarUrl) {
            try {
                const oldFilepath = path.join(uploadDir, path.basename(user.avatarUrl));
                await fs.unlink(oldFilepath);
            } catch (err) {
                logger(`Failed to delete old avatar: ${err.message}`, 4);
            }
        }

        user.avatarUrl = `/avatars/${filename}`;
        await user.save();

        res.json({ 
            message: "Avatar updated successfully", 
            avatarUrl: user.avatarUrl, 
            error: false 
        });
    } catch (error) {
        logger(`Avatar upload failed: ${error.message}`, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

// Profile routes
router.get("/profile", limiter, getUser, getProfile);
router.put("/profile", limiter, getUser, updateProfile);
router.post("/avatar", limiter, getUser, uploadAvatar);

// Friend system routes
router.get("/search", limiter, getUser, searchUsers);
router.get("/friends", limiter, getUser, getFriends);
router.get("/friends/requests", limiter, getUser, getFriendRequests);
router.post("/friends/requests", friendRequestLimiter, getUser, sendFriendRequest);
router.put("/friends/requests/:requestId", limiter, getUser, updateFriendRequest);

module.exports = router;