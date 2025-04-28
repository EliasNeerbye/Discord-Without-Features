module.exports = (message = "An error has occurred", level = 5) => {
    const colors = {
        debug: '\x1b[90m',  // Gray (bright black)
        info: '\x1b[34m',   // Blue
        log: '\x1b[37m',    // White
        warn: '\x1b[33m',   // Yellow
        error: '\x1b[31m'   // Red
    };
    
    const reset = '\x1b[0m';
    
    switch (level) {
        case 1:
            console.debug(`${colors.debug}${message}${reset}`);
            break;
        case 2:
            console.info(`${colors.info}${message}${reset}`);
            break;
        case 3:
            console.log(`${colors.log}${message}${reset}`);
            break;
        case 4:
            console.warn(`${colors.warn}${message}${reset}`);
            break;
        case 5:
            console.error(`${colors.error}${message}${reset}`);
            break;
        default:
            console.error(`${colors.error}An error has occurred!${reset}`);
    }
};
