require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/chatApp",
    CLIENT_URL: process.env.CLIENT_URL || "*",
    JWT_KEY: process.env.JWT_KEY || "very_super_secret_key",
    NODE_ENV: process.env.NODE_ENV || "development"
}