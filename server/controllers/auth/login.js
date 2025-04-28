/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               username:
 *                 type: string
 *                 description: User's username (alternative to email)
 *               password:
 *                 type: string
 *                 description: User's password
 *             example:
 *               email: user@example.com
 *               password: password123
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully logged in!
 *                 error:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
const validator = require("validator");
const logger = require("../../util/logger");
const jwt = require("../../util/jwtHandler");
const User = require("../../models/User");
const { verify: verifyPassword } = require("argon2");
const cookieHandler = require("../../util/cookieHandler");

module.exports = async (req, res) => {
    const { email, username, password } = req.body;

    if (validator.isEmpty(email || '') && validator.isEmpty(username || '')) {
        return res.status(400).json({ message: "Please provide email or username.", error: true });
    }
    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ message: "Please provide a valid email address.", error: true });
    }
    if (validator.isEmpty(password || '')) {
        return res.status(400).json({ message: "Please provide password.", error: true });
    }

    let user;

    try {
        const query = {};
        if (email) {
            query.email = email;
        } else if (username) {
            query.username = username;
        } else {
            return res.status(400).json({ message: "Please provide email or username.", error: true });
        }

        user = await User.findOne(query);

        if (!user || !user.passwordHash || !await verifyPassword(user.passwordHash, password)) {
            return res.status(401).json({ message: "Email/Username or password is incorrect!", error: true });
        }

    } catch (error) {
        logger(`An error occurred during user lookup or password verification: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    let token;
    try {
        token = jwt.signJwt({ userId: user._id, email: user.email });
    } catch (error) {
        logger(`An error occurred while signing JWT: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    cookieHandler.setAuthCookie(res, token);

    return res.status(200).json({ message: "Successfully logged in!", error: false });
};