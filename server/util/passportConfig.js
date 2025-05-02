const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./config');
const logger = require('./logger');

// Configure Google Strategy
const setupPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: `${config.SERVER_URL}/api/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, params, profile, done) => {
        try {
          // Pass the profile to the callback handler
          return done(null, profile);
        } catch (error) {
          logger(`Error in Google strategy: ${error.message}`, 5);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user - this is simplified as we're using JWT and not sessions
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  return passport;
};

module.exports = setupPassport;