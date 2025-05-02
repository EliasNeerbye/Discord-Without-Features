/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 * 
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 * 
 *   put:
 *     summary: Update current user's profile
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username
 *               currentPassword:
 *                 type: string
 *                 description: Current password (required to change password)
 *               newPassword:
 *                 type: string
 *                 description: New password (must be at least 8 characters)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated or incorrect current password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 * 
 * /api/users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, or WEBP, max 10MB)
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 error:
 *                   type: boolean
 *       400:
 *         description: Invalid input or file type
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

const User = require("../../models/User");
const logger = require("../../util/logger");
const { hash: hashPassword, verify: verifyPassword } = require("argon2");

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }
        res.json(user);
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        // Explicitly include passwordHash in the query
        const user = await User.findById(req.user.userId).select("+passwordHash");

        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ message: "Username already taken", error: true });
            }
            user.username = username;
        }

        if (currentPassword && newPassword) {
            if (!user.passwordHash) {
                return res.status(400).json({ message: "Cannot set password for OAuth user", error: true });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters", error: true });
            }
            
            // Verify the current password
            if (await verifyPassword(user.passwordHash, currentPassword)) {
                user.passwordHash = await hashPassword(newPassword);
            } else {
                return res.status(401).json({ message: "Current password is incorrect", error: true });
            }
        }

        await user.save();
        res.json({ message: "Profile updated successfully", error: false });
    } catch (error) {
        logger(error.message, 5);
        res.status(500).json({ message: "Server error", error: true });
    }
};

module.exports = { getProfile, updateProfile };