/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Send email verification link
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
 *                 format: email
 *                 description: User's email address
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: Email verification sent
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 * 
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email using token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const User = require('../../models/User');
const emailService = require('../../util/emailService');
const logger = require('../../util/logger');
const validator = require('validator');

// Send email verification link
const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address', error: true });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found', error: true });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified', error: true });
    }

    // Send verification email
    await emailService.sendVerificationEmail(user);

    return res.status(200).json({ 
      message: 'Verification email sent. Please check your inbox.', 
      error: false 
    });
  } catch (error) {
    logger(`Error sending verification email: ${error.message}`, 5);
    return res.status(500).json({ message: 'Something went wrong on our side!', error: true });
  }
};

// Verify email with token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token
    if (!token) {
      return res.status(400).json({ message: 'Invalid token', error: true });
    }

    // Find user by token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired', error: true });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    return res.status(200).json({ 
      message: 'Email verified successfully. You can now log in.', 
      error: false 
    });
  } catch (error) {
    logger(`Error verifying email: ${error.message}`, 5);
    return res.status(500).json({ message: 'Something went wrong on our side!', error: true });
  }
};

module.exports = { sendVerificationEmail, verifyEmail };