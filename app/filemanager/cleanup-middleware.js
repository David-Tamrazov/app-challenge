const path = require('path');
const logger = require('../logger').logger;

// middleware that will be called once a response has been sent to the client
// we will use it to cleanup the tmp directory and delete any remaining files to keep disk storage free
const onFinished = require('on-finished');

// framework for easy synchronous file management in node
const fs = require('fs-extra');


// middleware to mount to post requests that will remove temporary files once the request has finished
const fileCleanup = (req, res, next) => {
    
    // relative path of the tmp directory
    var tmp = path.resolve('app', 'tmp');
    var hold = true;
    onFinished(res, (err, res) => {

        try {
            fs.emptyDirSync(tmp) 
        } catch(e) {
            logger.log(e + "\n");
        }
         
    });

    return next();

}

module.exports = fileCleanup;