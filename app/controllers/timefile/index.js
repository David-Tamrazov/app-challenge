const express = require('express');
const router = express.Router();
const path = require('path');

// use async.js to handle control flow between asynchronous functions for cleaner callbacks
const async = require('async');

// use csvjson to perform some pre-parsing on the file before handing it off to the final request handler 
const csv = require('csvtojson');

// Error types object for returning our own generic errors as server responses
const ErrorTypes = require(path.resolve('app', 'error')).types;

// Model object for calling timefile-relevant CRUD and model methods
const Timefile = require(path.resolve('app', 'models')).Timefile;

// Model object to validate the rows of the file received in the request
const FileRow = require(path.resolve('app', 'models')).FileRow;

// Payroll report model object - will perform the processing of the timefile into a payroll report that gets returned to the user 
const PayrollReport = require(path.resolve('app', 'models')).PayrollReport;

// logger for error logging 
const logger = require(path.resolve('app', 'logger')).logger;

/* 

    Parse the file located at pathname that multer attached to the request 
    Add each row as a reformatted JSON object to the request body.
    If the file is of invalid format, type, or does not exist, parseFile will throw an error, and we can return a generic bad request response to the client.

*/  
var parseTimefile = (req, res, next) => {
    
    var timefileJSONArray = []

    // log the name of the file in case of error 
    logger.log(req.file.originalname + "\n");

    // get the filepath where multer stored the temporary csv
    var filepath = path.resolve(req.file.path)
    
    // create a converter object
    const converter = csv().fromFile(filepath)
    converter.on('json', (timefileRow) => {
     
        // invalid file format- return a Bad Request response to the client
        if (!FileRow.validRow(timefileRow)) {

            // stop reading data- we already know its a bad file
            converter.removeAllListeners('json');

            // return a bad request response 
            return next(ErrorTypes.badRequest("Invalid csv format."));
        }
        
        // if we ran into the row with the report ID, set that in the request body
        else if (timefileRow['date'] == 'report id') req.body.reportID = timefileRow['hours worked'];

        // its just a standard row- push that to the timefileJSONArray 
        else timefileJSONArray.push(Timefile.formatTimefileRow(timefileRow));

    })
    .on('done', (err) => {

        // no report ID was found - file is either not a CSV or its poorly formatted. return a bad request response
        if (!req.body.reportID) {
            return next(ErrorTypes.badRequest());
        }
        
        
        // some serverside error occured - log it and send back a server error response
        else if (err) {

            //log the error
            logger.log(err +"\n");
            return next(ErrorTypes.serverError())

        } 

        // set the processed timefile as a json object in the request 
        req.body.timefileJSONArray = timefileJSONArray;
        return next();

    });      
}


// check to make sure a report with this ID hasn't already been processed
// we do this here to avoid any unnecessary file processing in the actual response handler
var validateReportID = (req, res, next) => {

    Timefile.validateReportID(req.body.reportID, (err, validID) => {
        
        // serverside error/query error here -  return a server error response to the client, error has been logged in the query method
        if (err) {
            return next(ErrorTypes.serverError());
        }
        
         // no error, but report already exists so we need to return a bad request error
        else if (!validID) {
            logger.log("Attempt to submit the same report twice.\n");
            return next(ErrorTypes.badRequest('Cannot upload two reports with the same report id.'));
        }      
        
       // report doesn't exist, we can proceed to add the timefile an generate the report
        return next();

    });

};

var postNewTimefile = (req, res, next) => {

    // access the parsed timefile object our middleware stored in the request body
    var file = req.body.timefileJSONArray;
    var reportID = req.body.reportID;

    async.series([
        // store the timefile
        Timefile.storeTimefile.bind(null, file, reportID),
        // process a new payroll report
        PayrollReport.processPayroll, 
    ], (err, results) => {

        // let the error middleware handle the error
        if (err) return next(err);

        // otherwise return the newly processed payroll
        return res.status(200).send("Successfull file upload!");

    });

}

router.post('/', [parseTimefile, validateReportID, postNewTimefile]);


module.exports.router = router;

