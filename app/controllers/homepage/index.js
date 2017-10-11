const express = require('express');
const router = express.Router();
const path = require('path');
const PayrollReport = require(path.resolve('app', 'models')).PayrollReport;

/*
    Renders the homepage with the payroll report already embedded in it. 
*/
var sendHomePage = (req, res, next) => {

    PayrollReport.retrievePayrollReport((err, report) => {

        if (err) {
            return next(err);
        }
    
        return res.status(200).render('homepage', { payroll: report });

    });    

}

router.get('/', sendHomePage);

module.exports.router = router;

