const path = require('path');
const async = require('async');
const helpers = require(path.resolve('app', 'helpers'));
const knex = require(path.resolve('app', 'db')).knex;
const connection = require(path.resolve('app', 'db')).connection;
const logger = require(path.resolve('app', 'logger')).logger;
const Timefile = require('../timefile');
const ErrorTypes = require(path.resolve('app', 'error')).types;

/*
    Processes a payroll after a new timefile has been submitted to the database. 
    To ensure 100% complete consistency between timefiles and payroll reports, a fresh payroll report is created after every submission... 
    ... using all of the timefile data (now) stored in the server. 

    In the interest of total consistency, newly-processed payroll also completely replaces the old payroll file. 
    Please see the test case for concrete examples in tests/models/payroll-report/unit/payroll-report-unit-tests.spec.js

    If a client wishes to retrieve payroll data without submitting a timeile, a different function is called to complete the request without any preprocessing
*/
var processPayroll = (cb) => {

    async.waterfall([
        // pull all timefile data from the database
        Timefile.pullTimefileData, 
        // create a payroll report with the timefile data
        createPayrollReport,
        // store the newly created payroll report
        storePayrollReport
    ], (err, results) => {

        if (err) {
            logger.log(err + '\n\n');
            return cb(ErrorTypes.serverError(), null);
        }

        // return the payroll report
        return cb(null, results);
    });

}

/*
    Retrieve the entire payroll report from the database and return it to the client.
    Used when the client only wants to get the payroll without submitting a new timefile
*/
var retrievePayrollReport = (cb) => {

    var query = knex.select()
                    .from('payroll_report')
                    .toString();
    
    connection.query(query, (err, results) => {

        if (err) {
            logger.log(err +'\n\n');
            return cb(ErrorTypes.serverError(), null);
        }

        return cb(null, results);

    });

}


/*

    Store the newly-processed payroll report in the database.
    Completely replaces old report with new report to ensure consistency with timefiles table 

*/
var storePayrollReport = (payrollReport, cb) => {

    var query = knex.insert(payrollReport)
                    .into('payroll_report')
                    .toString() + 'ON DUPLICATE KEY UPDATE amount_paid = VALUES(amount_paid)';
    
    connection.query(query, (err, results) => {

        // do some error processing- log the error and return it to the client 
        if (err) {
            logger.log(err + '\n\n');
            return(ErrorTypes.serverError(), null);
        }

        return cb(null, payrollReport);

    });         
}

/*
    Create payroll report out of the timefile data -  this will be the payroll report we return to the client 
        Note: even though createPayrollReport is synchronous, it contains a callback so that it may be include in the processPayroll async.waterfall call
        This allows us to keep the payroll object creation out of the asynchronous payroll db storage method, separating the concerns out and making the code easier to test 
*/
var createPayrollReport = (timefileData, cb) => {

    var payrollData = Array.from(timefileData, timefileRow => createPayrollRow(timefileRow));

    // first group all the data by employee_id
    var groupByEID = groupPayrollByEID(payrollData);

    // next reduce the payment array by the pay period for each employee
    var reducedArray = groupByEID.map((employeePayrollArray) => reducePayrollArray(employeePayrollArray));
    
    // finally flatten the result and return it
    return cb(null, [].concat.apply([], reducedArray));
}

/*
    Reduce an array of payroll row objects, accumulating amount_paid for objects with the same pay period
    When creating the payroll report, this will be called on every array of payroll row objects, each corresponding to a different employee's payroll data
*/
var reducePayrollArray = (employeePaymentArray) => {

    // reduce on the payment period to combine all of the earnings at each payment period
    var reducedArray = employeePaymentArray.reduce((accumulator, employeePayment) => {
        
        var pay_period = employeePayment.pay_period;

        if (pay_period in accumulator) accumulator[pay_period].amount_paid += employeePayment.amount_paid;
        else accumulator[pay_period] = employeePayment;
        return accumulator;
        
    }, {});  

    // return an array of the combined arrays - we're not interested in the index anymore
    return Object.keys(reducedArray).map((key) => reducedArray[key]);
}

/*
    Return an array of arrays of payroll row objects.
    Each array corresponds to the payroll data for one employee, sorted by employee_id
*/
var groupPayrollByEID = (payrollData) => {

    // use a reduce statement to group together all payroll objects with the same employee ID 
    var groupByEID = payrollData.reduce((accumulator, payrollObj) => {
        
        var employee_id = payrollObj.employee_id; 

        // if the employee_id hasn't been encountered yet, instantiate an array with this payroll obj and set the array as the value for this employee_id key
        if (!(employee_id in accumulator)) accumulator[employee_id] = [payrollObj];

        // else push the payroll object with the matching employee_id onto the already existing array 
        else accumulator[employee_id].push(payrollObj);

        return accumulator;

    }, {});

    // return an array of the combined arrays - we're not interested in the employee_id object index anymore
    return Object.keys(groupByEID).map((eid) => groupByEID[eid]);
}


/*

    Create a row of a payroll table from a timefile table row
    Each payroll row has the form:
   
        {
           employee_id: X,
          amount paid: Y,
          pay_period: Z
        }

*/
var createPayrollRow = (timefileRow) => {

    var salary = timefileRow.job_group == 'A' ? 20 : 30; 
    var amountPaid = salary * timefileRow.hours_worked; 
    var payPeriod = helpers.getPayPeriod(timefileRow.date);

    return {
        'employee_id': timefileRow.employee_id, 
        'amount_paid': amountPaid, 
        'pay_period': payPeriod
    }

}

module.exports = {
    processPayroll, 
    retrievePayrollReport,
    storePayrollReport,
    createPayrollReport,
    reducePayrollArray,
    groupPayrollByEID, 
    createPayrollRow, 
}