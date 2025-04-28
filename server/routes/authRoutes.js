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
})

const isAlreadyAuth = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        return res.status(401).json({message:"User is already logged in!", error: true})
    } else {
        next()
    }
}

const login = require("../controllers/auth/login")
const register = require("../controllers/auth/register")
const logout = require("../controllers/auth/logout")

router.post("/login", limiter, isAlreadyAuth, login)
router.post("/register", limiter, isAlreadyAuth, register)
router.delete("/logout", limiter, logout)

module.exports = router;