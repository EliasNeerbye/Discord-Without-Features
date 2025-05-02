require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/chatApp",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    JWT_KEY: process.env.JWT_KEY || "very_super_secret_key",
    NODE_ENV: process.env.NODE_ENV || "development",
    
    // Email configuration
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || '"Discord Without Features" <no-reply@discordwithoutfeatures.com>',
    EMAIL_SECURE: process.env.EMAIL_SECURE || "false"
}