const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs/promises");
const getUser = require("../middleware/getUser");
const { getProfile, updateProfile } = require("../controllers/user/profile");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
});

const uploadAvatar = async (req, res) => {
    try {
        if (!req.files || !req.files.avatar) {
            return res.status(400).json({ message: "No avatar file uploaded", error: true });
        }

        const avatar = req.files.avatar;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(avatar.mimetype)) {
            return res.status(400).json({ message: "Invalid file type", error: true });
        }

        if (avatar.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File too large (max 5MB)", error: true });
        }

        const uploadDir = path.join(__dirname, '../uploads/avatars');
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${req.user.userId}-${Date.now()}${path.extname(avatar.name)}`;
        const filepath = path.join(uploadDir, filename);
        
        await avatar.mv(filepath);

        const user = await User.findById(req.user.userId);
        if (user.avatarUrl) {
            const oldFilepath = path.join(uploadDir, path.basename(user.avatarUrl));
            await fs.unlink(oldFilepath).catch(() => {});
        }

        user.avatarUrl = `/avatars/${filename}`;
        await user.save();

        res.json({ message: "Avatar updated successfully", avatarUrl: user.avatarUrl, error: false });
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

router.get("/profile", limiter, getUser, getProfile);
router.put("/profile", limiter, getUser, updateProfile);
router.post("/avatar", limiter, getUser, uploadAvatar);

module.exports = router;