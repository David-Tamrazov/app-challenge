/*
    Returns a generic error object with provided parameters.
    Helps keep the server a black box by hiding implementation details
*/
var err = (statusCode, errMsg) => {
    
    return {
        statusCode: statusCode, 
        message: errMsg, 
        ownError: true
    }

}

var notFound = (errMsg) => {
    return err(404, errMsg || "Resource not found.");
}

var badRequest = (errMsg) => {
    return err(400, errMsg || "Bad Request.");
}

var serverError = (errMsg) => {
    return err(500, errMsg || "Server Error. Please try again later.");
}

module.exports = {
    notFound,
    badRequest,
    serverError
}