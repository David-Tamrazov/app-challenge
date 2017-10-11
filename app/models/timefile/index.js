const path = require('path');
const knex = require(path.resolve('app', 'db')).knex;
const connection = require(path.resolve('app', 'db')).connection;
const ErrorTypes = require(path.resolve('app', 'error')).types;
const helpers = require(path.resolve('app', 'helpers'));
const logger = require(path.resolve('app', 'logger')).logger;

/* 

    Checks the database for a report with this report ID
        If found, return false - the validation middleware will throw an error, and we'll prevent the client from submitting the report twice
        Otherwise, return true - the validation passed
*/
var validateReportID = (reportID, cb) => {

    var query = knex.select('report_id')
                    .from('timefiles')
                    .where('report_id', reportID)
                    .toString();

    connection.query(query, (err, results) => {

        // log the error and return a custom server error object 
        if (err) {
            logger.log(err + '\n\n');
            return cb(ErrorTypes.serverError(), null);
        }

        // return a null err and a boolean check whether any records exist with this report id
        return cb(null, results.length == 0);
    
    });
}


/*
    Stores the array of Timefile Row objects in bulk;
    Every object represents one row of the submitted timefile, with the array representing the timefile as a whole
*/
var storeTimefile = (timefileRowArray, reportID, cb) => {

    // add the reportID to each row object
    timefileRowArray.map( (x) => {
        x.report_id = reportID;
    });

    var query = knex.insert(timefileRowArray)
                    .into('timefiles')
                    .toString();

    // store the timefile within the relational database
    connection.query(query, (err, results) => {

        if (err) {

            // log the error
            logger.log('code: ' + err.code + '\nerrno:' + err.errno + '\nmessage:' + err.sqlMessage + '\nsqlState: ' + err.sqlState + '\n\n');

            if (err.errno == 1062) {

                // notify the client that they're attempting to overwrite an employee's previously-recorded hours if its a duplicate key error
                var postError = ErrorTypes.badRequest("Attempt to log employee hours twice: " + err.message);
           
                // reverse any changes made to the database (delete all recorded rows) to let the client resubmit the same timefile after corrections (if necessary)
                return rollbackStorage(reportID, postError, cb);

            } else {
                return cb(ErrorTypes.serverError(), null);
            }

        }

        // succesfull insertion; return true;
        return cb(null, true);

    });

}

// rollback function that will delete every row of a timefile from the database in case filestorage failed 
var rollbackStorage = (reportID, duplicateError, cb) => {
  
    var query = knex.delete()
                    .from('timefiles')
                    .where('report_id', reportID)
                    .toString();

    connection.query(query, (err, result) => {

        if(err) {
            // log the error; 
            logger.log(err + '\n\n');

            // We still want to notify the client that they're trying to overwrite data they've already stored
            return cb(duplicateError, null);
        }

        return cb(duplicateError, null);

    });
}

/*
    Pull all timefile data stored on the database. 
    This data will be used in 'models/payroll-report/index.js' to create a payroll report.
*/
var pullTimefileData = (cb) => {
    
    var query = knex.select()
                    .from('timefiles')
                    .orderBy('employee_id', 'asc')
                    .orderBy('date', 'asc')
                    .toString();

    connection.query(query, (err, results) => {

        if (err) {   
            logger.log(err + '\n\n');
            return cb(ErrorTypes.serverError(), null);
        }

        return cb(null, results);

    });

}

/* 

    Reformats the row from a submitted timefile for SQL storage:
        use '_' instead of spaces
        reformat "xx/yy/zzzz" dates to "zzzz-yy-xx"

*/
var formatTimefileRow = (timefileRow) => {

    return  {
        employee_id: timefileRow['employee id'],
        hours_worked: timefileRow['hours worked'],
        date: helpers.reverseDateString(timefileRow['date']),
        job_group: timefileRow['job group']
    }
    
}


module.exports = {
    validateReportID,
    storeTimefile,
    rollbackStorage,
    pullTimefileData, 
    formatTimefileRow
};