/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth login
 * 
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to client app with auth cookie set
 *       500:
 *         description: Server error
 */
const User = require('../../models/User');
const logger = require('../../util/logger');
const jwt = require('../../util/jwtHandler');
const cookieHandler = require('../../util/cookieHandler');
const passport = require('passport');
const config = require('../../util/config');

// Initiate Google OAuth flow
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Handle callback from Google
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, profile, info) => {
    if (err) {
      logger(`Google OAuth error: ${err.message}`, 5);
      return res.redirect(`${config.CLIENT_URL}/login?error=oauth_error`);
    }

    if (!profile) {
      logger('Google OAuth failed: No profile returned', 4);
      return res.redirect(`${config.CLIENT_URL}/login?error=oauth_error`);
    }

    try {
      // Try to find existing user by googleId
      let user = await User.findOne({ googleId: profile.id });

      // If no user found by googleId, check if email exists
      if (!user && profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });

        // If user exists with this email but different auth method
        if (user && user.authMethod !== 'google') {
          // Handle account linking or conflict based on your requirements
          // For this implementation, we'll return an error
          logger(`OAuth email conflict for: ${email}`, 4);
          return res.redirect(`${config.CLIENT_URL}/login?error=email_exists`);
        }
      }

      // Create new user if not found
      if (!user) {
        user = new User({
          email: profile.emails[0].value,
          googleId: profile.id,
          authMethod: 'google',
          username: profile.displayName || null,
          isEmailVerified: true, // Emails from Google OAuth are verified
          avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
        });

        await user.save();
        logger(`New Google user created: ${user.email}`, 2);
      } else if (!user.googleId) {
        // Update googleId if user exists but googleId not set
        user.googleId = profile.id;
        user.authMethod = 'google';
        // We may also want to update other fields like avatarUrl
        if (profile.photos && profile.photos.length > 0) {
          user.avatarUrl = profile.photos[0].value;
        }
        await user.save();
        logger(`User updated with Google info: ${user.email}`, 2);
      }

      // Create and set JWT token
      const token = jwt.signJwt({ userId: user._id, email: user.email });
      cookieHandler.setAuthCookie(res, token);

      // Redirect to client application
      res.redirect(config.CLIENT_URL);
    } catch (error) {
      logger(`Google OAuth error during user processing: ${error.message}`, 5);
      res.redirect(`${config.CLIENT_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

module.exports = {
  googleAuth,
  googleCallback
};