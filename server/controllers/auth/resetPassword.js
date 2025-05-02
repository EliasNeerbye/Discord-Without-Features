/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset link
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
 *         description: Password reset email sent
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 * 
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 description: New password
 *             example:
 *               token: abcd1234
 *               password: newPassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid input or token
 *       500:
 *         description: Server error
 */
const User = require('../../models/User');
const emailService = require('../../util/emailService');
const logger = require('../../util/logger');
const validator = require('validator');
const { hash: hashPassword } = require('argon2');

// Request password reset (send email)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address', error: true });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link.', 
        error: false 
      });
    }

    // Only local auth users can reset password
    if (user.authMethod !== 'local') {
      return res.status(400).json({ 
        message: 'Cannot reset password for accounts using OAuth authentication', 
        error: true 
      });
    }

    // Send password reset email
    await emailService.sendPasswordResetEmail(user);

    return res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link.', 
      error: false 
    });
  } catch (error) {
    logger(`Error in forgot password: ${error.message}`, 5);
    return res.status(500).json({ message: 'Something went wrong on our side!', error: true });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate inputs
    if (!token) {
      return res.status(400).json({ message: 'Token is required', error: true });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required', error: true });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long', error: true });
    }

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired', error: true });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.', 
      error: false 
    });
  } catch (error) {
    logger(`Error resetting password: ${error.message}`, 5);
    return res.status(500).json({ message: 'Something went wrong on our side!', error: true });
  }
};

module.exports = { forgotPassword, resetPassword };