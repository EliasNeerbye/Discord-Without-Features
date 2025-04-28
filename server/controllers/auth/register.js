/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               username:
 *                 type: string
 *                 description: User's username (optional)
 *               password:
 *                 type: string
 *                 description: User's password (minimum 8 characters)
 *             example:
 *               email: user@example.com
 *               username: newuser
 *               password: password123
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully registered!
 *                 error:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
const validator = require("validator");
const logger = require("../../util/logger");
const jwt = require("../../util/jwtHandler");
const User = require("../../models/User");
const { hash: hashPassword } = require("argon2");
const cookieHandler = require("../../util/cookieHandler");

module.exports = async (req, res) => {
    const { email, username, password } = req.body;

    if (validator.isEmpty(email || '')) {
        return res.status(400).json({ message: "Please provide email.", error: true });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Please provide a valid email address.", error: true });
    }
    if (username && validator.isEmpty(username)) {
        return res.status(400).json({ message: "Username cannot be empty if provided.", error: true });
    }

    if (validator.isEmpty(password || '')) {
        return res.status(400).json({ message: "Please provide password.", error: true });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long.", error: true });
    }

    let existingUser;
    try {
        const query = { email };
        if (username) {
            query.$or = [{ email }, { username }];
        }
        existingUser = await User.findOne(query);

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(409).json({ message: "User with this email already exists.", error: true });
            }
            if (username && existingUser.username === username) {
                return res.status(409).json({ message: "User with this username already exists.", error: true });
            }
            return res.status(409).json({ message: "User already exists.", error: true });
        }
    } catch (error) {
        logger(`An error occurred during user lookup: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    let passwordHash;
    try {
        passwordHash = await hashPassword(password);
    } catch (error) {
        logger(`An error occurred during password hashing: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    const newUser = new User({
        email,
        passwordHash,
        authMethod: 'local'
    });

    if (username) {
        newUser.username = username;
    }

    try {
        await newUser.save();
    } catch (error) {
        logger(`An error occurred during saving new user: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    let token;
    try {
        token = jwt.signJwt({ userId: newUser._id, email: newUser.email });
    } catch (error) {
        logger(`An error occurred while signing JWT: ${error.message}`, 5);
        return res.status(500).json({ message: "Something went wrong on our side!", error: true });
    }

    cookieHandler.setAuthCookie(res, token);

    return res.status(201).json({ message: "Successfully registered!", error: false });
};