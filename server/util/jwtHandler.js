const jwt = require("jsonwebtoken");
const logger = require("./logger");
const config = require("./config");

const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 Days

const signJwt = (data, expirySeconds = DEFAULT_EXPIRY_SECONDS) => {
    return jwt.sign(data, config.JWT_KEY, {
        expiresIn: expirySeconds,
    });
};

const verifyJwt = (tokenString) => {
    try {
        return jwt.verify(tokenString, config.JWT_KEY);
    } catch (err) {
        logger(`JWT verification failed: ${err}`, 5);
        return null;
    }
};

module.exports = { signJwt, verifyJwt };