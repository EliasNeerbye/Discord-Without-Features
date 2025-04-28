const { clearAuthCookie } = require("../../util/cookieHandler")
const logger = require("../../util/logger")

module.exports = (req, res) => {
    try {
        clearAuthCookie(res)
        res.status(200).json({message:"You are now logged out!", error: false})
    } catch (error) {
        logger(`Failed to clear cookie: ${error.message}`, 5)
        res.status(500).json({message:"Something went wrong on our side!", error: true})
    }
}