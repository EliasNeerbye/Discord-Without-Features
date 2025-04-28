const logger = require("../util/logger")

module.exports = (io) => {
    io.on("connection", (socket) => {
        logger("Someone connected to the socket!", 1)

        socket.on("sendMessage", (data) => {
            logger(`Someone sent a message: ${data}`, 1)
            io.emit("receiveMessage");
        })

        socket.on("disconnect", () => {
            logger("Someone disconnected from the socket!", 1)
        })
    })
}