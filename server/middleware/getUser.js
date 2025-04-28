/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 */
const jwtHandler = require("../util/jwtHandler");

module.exports = (req, res, next) => {
    const token = req.cookies ? req.cookies.token : null;

    if (!token) {
        return res.status(401).json({ message: "Authentication token not found.", error: true });
    }

    const decoded = jwtHandler.verifyJwt(token);

    if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired authentication token.", error: true });
    }

    req.user = decoded;
    next();
};