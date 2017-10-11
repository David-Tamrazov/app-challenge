const logger = require('../index').logger;

// middleware to log all request info
var requestLogger = (req, res, next) => {
    var reqInfo = req.method + ' : ' + req.originalUrl;
    logger.log(reqInfo);
    next();
}

module.exports = requestLogger;