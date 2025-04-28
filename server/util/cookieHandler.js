const config = require("./config");

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    //sameSite: 'lax',
    path: '/',
};

const DEFAULT_EXPIRY_MILLISECONDS = 7 * 24 * 60 * 60 * 1000; // 7 Days

const setAuthCookie = (res, token, maxAgeMilliseconds = DEFAULT_EXPIRY_MILLISECONDS) => {
    res.cookie('token', token, {
        ...COOKIE_OPTIONS,
        maxAge: maxAgeMilliseconds,
    });
};

const clearAuthCookie = (res) => {
    res.clearCookie('token', COOKIE_OPTIONS);
};

module.exports = {
    setAuthCookie,
    clearAuthCookie,
};