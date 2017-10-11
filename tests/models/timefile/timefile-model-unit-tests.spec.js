const expect = require('chai').expect;
const path = require('path');
const mysql = require('mysql');

const Timefile = require(path.resolve('app', 'models')).Timefile;
const ErrorTypes = require(path.resolve('app', 'error')).types;
const connection = require(path.resolve('app', 'db')).connection;
const knex = require(path.resolve('app', 'db')).knex;


describe('Timefile validateReportID', () => {

    before((done) => {

        // rows to insert into the test database 
        var testRows = [
            {
                'job_group': 'A', 
                'date': '2017-06-05',
                'employee_id': 1,
                'hours_worked': 7.5, 
                'report_id': '1'
            },
            {
                'job_group': 'A', 
                'date': '2017-06-05',
                'employee_id': 2,
                'hours_worked': 7.5, 
                'report_id': '1'
            }
        ]

        var query = knex.insert(testRows)
                        .into('timefiles')
                        .toString();

        connection.query(query, (err, results) => {    
            if (err) return done(err)
            return done();
        });

    });

    after((done) => {

        // empty the test database 
        var query = knex.delete()
                        .from('timefiles')
                        .toString();

        connection.query(query, (err, results) => {
           if (err) return done(err);
           return done();
        });

    });

    it('should return false provided an invalid recordID for upload given that records with the provided ID exist', (done) => {

        Timefile.validateReportID(1, (err, validID) => {

            try {
                expect(err).to.be.null; 
                expect(validID).to.not.be.true;
                return done()
            } catch(e) {
                return done(e);
            }

        });

    });

    it('should return true provided a valid recordID for upload given that no records with the provided ID dont exist', (done) => {

        Timefile.validateReportID(2, (err, validID) => {

            try {
                expect(err).to.be.null;
                expect(validID).to.be.true;
                return done()
            } catch (e) {
                return done(e);
            }

        });

    });


});

describe('Timefile post new timefile', () => {


    //setup 
    beforeEach((done) => {

        // rows to insert into the test database 
        var testRows = [
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 1,
                'hours_worked': 7.5,
                'report_id': 1
            },
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 2,
                'hours_worked': 7.5,
                'report_id': 1
            }
        ]

        var query = knex.insert(testRows).into('timefiles').toString();

        connection.query(query, (err, results) => {    
            if (err)return done(err);
            return done();
        });

    });

    // teardown
    afterEach((done) => {

        // empty the test database 
        var query = knex.delete()
                        .from('timefiles')
                        .toString();

        connection.query(query, (err, results) => {    
            if (err) return done(err);
            return done();
        });

    });



    it('should post several timefile row objects succesfully provided valid timefile row objects', (done) => {

        var validInsertionRows = [
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 3,
                'hours_worked': 7.5
            },
            {
                'job_group': 'A',
                'date': '2017-07-05',
                'employee_id': 3,
                'hours_worked': 7.5
            }
        ]

        Timefile.storeTimefile(validInsertionRows, 2, (err, success) => {

            try {
                expect(err).to.be.null;
                expect(success).to.be.true;
                return done();
            } catch(e) {
                return done(e);
            }

        });

    });

    it('should throw an error if it attempts to post a timefile row object with a non-unique employeeid.date key', (done) =>{

        var invalidInsertionRows = [
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 2,
                'hours_worked': 7.5
            },
            {
                'job_group': 'A',
                'date': '2017-07-05',
                'employee_id': 3,
                'hours_worked': 7.5
            }
        ]

        Timefile.storeTimefile(invalidInsertionRows, 2, (err, success) => {

            try {
                expect(err).to.not.be.null;
                expect(err.statusCode).to.equal(400);
                expect(err.message).to.include('Attempt to log employee hours twice:');
                expect(success).to.not.be.true;
                return done();
            } catch(e) {
                return done(e);
            }
            
        });

    });

});

describe('Timefile pull timefile data', () => {

    // rows to insert into the test database 
    var testRows = [
        {
            'job_group': 'A',
            'date': '2017-03-03',
            'employee_id': 1,
            'hours_worked': 7.5,
            'report_id': 1
        },
        {
            'job_group': 'A',
            'date': '2017-02-02',
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


    // setup
    beforeEach((done) => {

        var query = knex.insert(testRows)
                        .into('timefiles')
                        .toString();

        connection.query(query, (err, results) => {
            if (err) return done(err);
            return done();
        });

    });

    // teardown
    afterEach((done) => {

        // empty the test database 
        var query = knex.delete().from('timefiles').toString();

        connection.query(query, (err, results) => {
            if (err) return done(err);
            return done();
        });

    });

    it('should pull all 3 of the data from the table, ordering first by ID then by date', (done) => {

        var firstDate = new Date(testRows[1].date);
        var secondDate = new Date(testRows[0].date);
        var thirdDate = new Date(testRows[2].date);


        Timefile.pullTimefileData((err, results) => {

            try {

                expect(err).to.be.null; 

                expect(results[0].employee_id).to.equal(testRows[1].employee_id);
                expect(results[0].date.getFullYear()).to.equal(firstDate.getUTCFullYear());
                expect(results[0].date.getMonth()).to.equal(firstDate.getUTCMonth());
                expect(results[0].date.getDate()).to.equal(firstDate.getUTCDate());

                expect(results[1].employee_id).to.equal(1);
                expect(results[1].date.getFullYear()).to.equal(secondDate.getUTCFullYear());
                expect(results[1].date.getMonth()).to.equal(secondDate.getUTCMonth());
                expect(results[1].date.getDate()).to.equal(secondDate.getUTCDate());

                expect(results[2].employee_id).to.eql(testRows[2].employee_id);

                return done();
                
            } catch(e) {
                return done(e);
            }

        });

    });
});


describe('Timefile rollback storage function', () => {

    before((done) => {

        var testTimefile =  {
            'job_group': 'A',
            'date': '2017-03-03',
            'employee_id': 1,
            'hours_worked': 7.5,
            'report_id': 1
        }

        var query = knex.insert(testTimefile)
                        .into('timefiles')
                        .toString();

        connection.query(query, (err, result) => {
            if(err) return done(err);
            return done();
        });

    });

    after((done) => {
        
        var query = knex.delete()
                        .from('timefiles')
                        .toString();

        connection.query(query, (err, result) => {
            if (err) return done(err);
            return done();
        });

    });

    it('should remove all timefile records with a given recordID from the database', (done) => {

        var duplicateKeyErr = ErrorTypes.badRequest();

        Timefile.rollbackStorage(1, duplicateKeyErr, (err, result) => {

            try{
                expect(err).to.not.be.null;
                expect(err.statusCode).to.equal(400);
                return done();
            } catch(e) {
                return done(e);
            }

        });
    });
});

describe('Timefile row formatter', () => {
    
        it('should create an object formatted for timefile SQL insertion from a provided csv table row object', () => {
    
            var unformattedRows = {
                'employee id': 5, 
                'hours worked': 10,
                'job group': 'A', 
                'date': '05/06/2017'
            }
    
            var expectedObj = {
                'employee_id': 5, 
                'hours_worked': 10,
                'job_group': 'A', 
                'date': '2017-06-05'
            }
    
            var formattedRows = Timefile.formatTimefileRow(unformattedRows);
    
            expect(formattedRows).to.eql(expectedObj);
    
        });
 });
