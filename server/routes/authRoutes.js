/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */
const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 Minutes
    limit: 10,
});

// Stricter rate limit for password reset to prevent abuse
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    limit: 3,
});

const isAlreadyAuth = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        return res.status(401).json({message:"User is already logged in!", error: true});
    } else {
        next();
    }
};

const login = require("../controllers/auth/login");
const register = require("../controllers/auth/register");
const logout = require("../controllers/auth/logout");
const { sendVerificationEmail, verifyEmail } = require("../controllers/auth/verifyEmail");
const { forgotPassword, resetPassword } = require("../controllers/auth/resetPassword");

router.post("/login", limiter, isAlreadyAuth, login);
router.post("/register", limiter, isAlreadyAuth, register);
router.delete("/logout", limiter, logout);

// Email verification routes
router.post("/verify-email", limiter, sendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);

// Password reset routes
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

module.exports = router;