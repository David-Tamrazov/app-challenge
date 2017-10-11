const logger = require('./logger');

// to keep testing output in the console for easier debugging
var logModule = process.env.NODE_ENV === "testing" ? console : logger

module.exports = {
    logger: logModule
};