const nodemailer = require('nodemailer');
const config = require('./config');
const logger = require('./logger');
const crypto = require('crypto');
const User = require('../models/User');

// Create a transporter object
const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_SECURE === 'true',
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD
    }
});

// Verify the transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Connection error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// Common email sending function
const sendEmail = async (options) => {
  try {
    const emailDefaults = {
      from: config.EMAIL_FROM || '"Discord Without Features" <no-reply@discordwithoutfeatures.com>'
    };

    const emailOptions = {
      ...emailDefaults,
      ...options
    };

    const info = await transporter.sendMail(emailOptions);
    logger(`Email sent: ${info.messageId}`, 2);
    
    // For dev environment, log the test URL
    if (config.NODE_ENV !== 'production' && info.testMessageUrl) {
      logger(`Email preview: ${info.testMessageUrl}`, 2);
    }
    
    return info;
  } catch (error) {
    logger(`Failed to send email: ${error.message}`, 5);
    throw error;
  }
};

// Email verification
const sendVerificationEmail = async (user) => {
  // Generate a token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Save the token and expiry to the user
  user.emailVerificationToken = token;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();
  
  // Create verification URL
  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Discord Without Features!</h2>
        <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #5865F2; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't sign up for an account, you can ignore this email.</p>
      </div>
    `
  });
};

// Password reset
const sendPasswordResetEmail = async (user) => {
  // Generate a token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Save the token and expiry to the user
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  await user.save();
  
  // Create reset URL
  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${token}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #5865F2; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `
  });
};

// Welcome email after verification
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Discord Without Features!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Discord Without Features!</h2>
        <p>Thank you for verifying your email address. Your account is now fully activated.</p>
        <p>Here are some tips to get started:</p>
        <ul>
          <li>Complete your profile by adding a profile picture</li>
          <li>Start a chat with another user</li>
          <li>Explore the available features</li>
        </ul>
        <p>We hope you enjoy using our platform!</p>
      </div>
    `
  });
};

// General notifications or announcements
const sendGeneralEmail = async (recipient, subject, htmlContent) => {
  return sendEmail({
    to: recipient,
    subject: subject,
    html: htmlContent
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendGeneralEmail
};