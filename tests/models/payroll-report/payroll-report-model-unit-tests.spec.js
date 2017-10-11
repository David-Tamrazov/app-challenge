const sinon = require('sinon');
const expect = require('chai').expect;
const path = require('path');
const knex = require(path.resolve('app', 'db')).knex;
const connection = require(path.resolve('app', 'db')).connection;

const PayrollReport = require(path.resolve('app', 'models')).PayrollReport;

describe('PayrollReport createPayrollRow', () => {

    it('should properly create a payroll object out of a timefile row object from the database', () => {

        var expectedA = {
            employee_id: 1, 
            amount_paid: 150, 
            pay_period: '16/10/2017 - 31/10/2017'
        }

        var expectedB = {
            employee_id: 1, 
            amount_paid: 225, 
            pay_period: '1/4/2017 - 15/4/2017' 
        }

        var testDateA = new Date('2017-10-16');
        var testDateB = new Date('2017-04-01');

        var timefileRowA = {
            employee_id: 1, 
            hours_worked: 7.5, 
            job_group: 'A',
            date: testDateA

        }

        var timefileRowB = {
            employee_id: 1,
            hours_worked: 7.5, 
            job_group: 'B', 
            date: testDateB
        }

        var payrollObjA = PayrollReport.createPayrollRow(timefileRowA);
        var payrollObjB = PayrollReport.createPayrollRow(timefileRowB);
       
        expect(payrollObjA).to.eql(expectedA);
        expect(payrollObjB).to.eql(expectedB);

    });

});


describe('PayrollReport map-reduce functions', () => {

    it('should group payroll data by employee_id', () => {

        var rawPayrollReport = [{
            employee_id: 1,
            amount_paid: 150,
            pay_period: '1/4/2017 - 15/4/2017'
        },
        {
            employee_id: 1,
            amount_paid: 150,
            pay_period: '16/10/2017 - 31/10/2017'
        },
        {
            employee_id: 1,
            amount_paid: 200,
            pay_period: '16/10/2017 - 31/10/2017'
        },
        {
            employee_id: 2,
            amount_paid: 300,
            pay_period: '1/4/2017 - 15/4/2017'
        }];

        var expectedArray = [
            [
                {
                    employee_id: 1,
                    amount_paid: 150,
                    pay_period: '1/4/2017 - 15/4/2017'
                },
                {
                    employee_id: 1,
                    amount_paid: 150,
                    pay_period: '16/10/2017 - 31/10/2017'
                },
                {
                    employee_id: 1,
                    amount_paid: 200,
                    pay_period: '16/10/2017 - 31/10/2017'
                }
            ],
            [
                {
                    employee_id: 2,
                    amount_paid: 300,
                    pay_period: '1/4/2017 - 15/4/2017'
                }
            ]
        ]

        var groupByEID = PayrollReport.groupPayrollByEID(rawPayrollReport);
        expect(groupByEID).to.eql(expectedArray);

    });

    it('should reduce employee-specific payroll data by pay_period into an accumulated payroll array', () => {

        var rawArray = [
                {
                    employee_id: 1,
                    amount_paid: 150,
                    pay_period: '1/4/2017 - 15/4/2017'
                },
                {
                    employee_id: 1,
                    amount_paid: 150,
                    pay_period: '16/10/2017 - 31/10/2017'
                },
                {
                    employee_id: 1,
                    amount_paid: 200,
                    pay_period: '16/10/2017 - 31/10/2017'
                }
        ]

        var expectedArray = [
            {
                employee_id: 1,
                amount_paid: 150,
                pay_period: '1/4/2017 - 15/4/2017'
            },
            {
                employee_id: 1,
                amount_paid: 350,
                pay_period: '16/10/2017 - 31/10/2017'
            }
        ]


        var reducedArray = PayrollReport.reducePayrollArray(rawArray);
        expect(reducedArray).to.eql(expectedArray);

    });


});


describe('PayrollReport createPayrollReport', () => {
    
    it('should return a properly formatted payroll table given timefile row data using its map-reduce functions', () => {

        var timefileTestData = [
            {
                employee_id: 1,
                hours_worked: 7.5, 
                job_group: 'A', 
                date: new Date('2017-04-01')
            },
            {
                employee_id: 1, 
                hours_worked: 7.5, 
                job_group: 'A',
                date: new Date('2017-10-16')
    
            },
            {
                employee_id: 1, 
                hours_worked: 10, 
                job_group: 'A',
                date: new Date('2017-10-20')
            }, 
            {
                employee_id: 2, 
                hours_worked: 10, 
                job_group: 'B', 
                date: new Date('2017-04-01')
            }
        ];

        var expectedReport = [
            {
                employee_id: 1,
                amount_paid: 150, 
                pay_period: '1/4/2017 - 15/4/2017'
            }, 
            {
                employee_id: 1,
                amount_paid: 350, 
                pay_period: '16/10/2017 - 31/10/2017'
            },
            {
                employee_id: 2, 
                amount_paid: 300, 
                pay_period: '1/4/2017 - 15/4/2017'
            }
        ]

        var report = PayrollReport.createPayrollReport(timefileTestData, (err, report) => {

            expect(err).to.be.null;
            expect(report).to.eql(expectedReport);

        });  
        

    });

});

describe('PayrollReport asynchronous functions', () => {

    // setup
    beforeEach((done) => {

        // insert into payroll_report a record to replace
        var report = [{
                employee_id: 1,
                amount_paid: 150, 
                pay_period: '1/4/2017 - 15/4/2017'
        }]

        // insert generic timefiles with appropriate eid's to satisfy foreign key constrait on the payroll_report table 
        var timefiles = [
            {
                'job_group': 'A',
                'date': '2017-04-03',
                'employee_id': 1,
                'hours_worked': 7.5,
                'report_id': 1
            },
            {
                'job_group': 'A',
                'date': '2017-04-02',
                'employee_id': 1,
                'hours_worked': 10,
                'report_id': 1
            },
            {
                'job_group': 'A',
                'date': '2012-01-01',
                'employee_id': 2,
                'hours_worked': 7.5,
                'report_id': 1
            }
        ]

        var timefileQuery = knex.insert(timefiles)
        .into('timefiles')
        .toString();

        var payrollReportQuery = knex.insert(report)
        .into('payroll_report')
        .toString();

        connection.query(timefileQuery, (err, success) =>{
           
            if (err) return done(err);
            connection.query(payrollReportQuery, (err, success) =>{
                if (err) return done(err);
                return done();
            })

        });

    });

    // tear-down; cleanup the test database
    afterEach((done) => {

        // remove all records from payroll_report table
        var payrollReportQuery = knex.delete()
                        .from('payroll_report')
                        .toString();
        
    
        // remove all records from timefiles table
        var timefileQuery = knex.delete()
                                .from('timefiles')
                                .toString();


        connection.query(payrollReportQuery, (err, success) =>{
           
            if (err) return done(err);
            connection.query(timefileQuery, (err, success) =>{
                if (err) return done(err);
                return done();
            })

        });

    });

    it('should replace the payroll report stored in the database with the one provided', (done) => {

        var newReport = [
            {
                employee_id: 1,
                amount_paid: 350, 
                pay_period: '1/4/2017 - 15/4/2017'
            },
            {
                employee_id: 2, 
                amount_paid: 300, 
                pay_period: '1/1/2012 - 15/1/2012'
            }
        ]

        PayrollReport.storePayrollReport(newReport, (err, payrollReport) => {

            try {
                expect(err).to.be.null; 
                expect(payrollReport).to.eql(newReport);
                return done();
            } catch (e) {
                return done(e);
            }

            // query the database and test to make sure all thats stored in it is the new report
            var query = knex.select()
                            .from('payroll_report')
                            .toString();

            connection.query(query, (err, results) => {

                try {
                    expect(results.length).to.equal(2);
                    expect(results).to.eql(newReport);
                    return done();
                } catch (e) {
                    return done(e);
                }
   
            })
        });

    });

    it('should process a new payroll using timefile data pulled from the database', (done) => {

        var newReport = [
            {
                'employee_id': 1, 
                'amount_paid': 350, 
                'pay_period': '1/4/2017 - 15/4/2017'
            }, 
            {
                'employee_id': 2, 
                'amount_paid': 150, 
                'pay_period': '1/1/2012 - 15/1/2012'
            }
        ]
        
        PayrollReport.processPayroll((err, payrollReport) => {

            try {
                expect(err).to.be.null;
                expect(payrollReport).to.eql(newReport);

                // query the database and test to make sure all thats stored in it is the new report
                var query = knex.select()
                    .from('payroll_report')
                    .toString();

                connection.query(query, (err, results) => {

                    try {
                        expect(results.length).to.equal(2);
                        expect(results).to.eql(newReport);
                        return done();
                    } catch (e) {
                        return done(e);
                    }

                })

            } catch (e) {
                return done(e);
            }


        });

    });

});
