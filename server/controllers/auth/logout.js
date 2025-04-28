/**
 * @swagger
 * /api/auth/logout:
 *   delete:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are now logged out!
 *                 error:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Server error
 */
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