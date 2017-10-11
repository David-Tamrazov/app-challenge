const ErrorTypes = require('./error-types');
const logger = require('../logger').logger;

var errorHandler = (err, req, res, next) => {

    // if there is no error, just continue normal execution
    if (!err) {
        return next();
    }

    // if its our own error, its already been logged elsewhere
    // return the error to the user 
    else if (err.ownError) {
        return res.status(err.statusCode).send(err.message)
    }

    // not our own error - something serverside went wrong
    // log the error and return our own serverside error - keep the DB a blackbox
    logger.log(err +"\n");
    var err = ErrorTypes.serverError();
    return res.status(err.status).send(err.message);

}

module.exports = {
    errorHandler
};