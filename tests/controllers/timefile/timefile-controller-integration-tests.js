// assertion library
const expect = require('chai').expect;
const path = require('path');
const assert = require('assert');
const request = require('supertest');
const sinon = require('sinon');
const knex = require(path.resolve('app', 'db')).knex;
const connection = require(path.resolve('app', 'db')).connection;
const app = require(path.resolve('server.js'));

describe('Timefile controller post new timefile route', () => {

    beforeEach((done) => {

        // rows to insert into the test database 
        var testRows = [
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 1,
                'hours_worked': 7.5,
                'report_id': '43'
            },
            {
                'job_group': 'A',
                'date': '2017-06-05',
                'employee_id': 2,
                'hours_worked': 7.5,
                'report_id': '43'
            }
        ]

        var deleteQuery = knex.delete()
            .from('timefiles')
            .toString();

        var insertQuery = knex.insert(testRows)
            .into('timefiles')
            .toString();

        connection.query(deleteQuery, (err, result) => {
            if (err) return done(err);

            connection.query(insertQuery, (err, result) =>{
                if(err) return done(err);
                return done();
            })

        })

    });

    afterEach((done) => {

        var deletePRQuery = knex.delete()
                                .from('payroll_report')
                                .toString();

        var deleteTFQuery = knex.delete()
                                .from('timefiles')
                                .toString();

        connection.query(deletePRQuery, (err, result) => {
            if (err) return done(err);

            connection.query(deleteTFQuery, (err, result) => {
                if (err) return done(err);
                return done();
            })

        })


    });



    it('should return a bad request response if provided a file that is not .csv', (done) => {
        
       
        var invalidFile = path.resolve('tests/controllers/timefile/test_assets') + '/invalid.txt';
       
        request(app)
        .post('/timefile')
        .attach('timefile', invalidFile)
        .end((err, res) => {

            if (err) return done(err);
            expect(res.error).to.not.be.null; 
            expect(res.error.status).to.equal(400);
            return done();
        });

    });

    it('should return a bad request response if provided a csv file that is improperly formatted', (done) => {
        
        var invalidCSV = path.resolve('tests/controllers/timefile/test_assets') + '/invalid.csv';

        request(app)
        .post('/timefile')
        .attach('timefile', invalidCSV)
        .end((err, res) => {

            if (err) return done(err);
            expect(res.error).to.not.be.null; 
            expect(res.error.status).to.equal(400);
            return done();

        });

    });

    it('should return a bad request response if provided a .csv file with a report_id that has been submitted before', (done) => {

        var resubmittedCSV = path.resolve('tests/controllers/timefile/test_assets') + '/resubmit.csv';
  
        request(app)
        .post('/timefile')
        .attach('timefile', resubmittedCSV)
        .end((err, res) => {

            if (err) return done(err);

            try {
                expect(res.error).to.not.be.null; 
                expect(res.error.status).to.equal(400);
                expect(res.error.text).to.include('Cannot upload two reports with the same report id.')
                return done();
            } catch (e) {
                return done(e)
            }

        });

    });

    it('should return a bad request response with duplicate error message if provided a .csv file that overwrites old records', (done) => {
        
        var overwriteCSV = path.resolve('tests/controllers/timefile/test_assets') + '/overwrite.csv';

        request(app)
        .post('/timefile')
        .attach('timefile', overwriteCSV)
        .end((err, res) => {

            if (err) return done(err);
            // Attempt to log employee hours twice:
            try {
                expect(res.error).to.not.be.null; 
                expect(res.error.status).to.equal(400);
                expect(res.error.text).to.include('Attempt to log employee hours twice:');
                return done();
            } catch (e) {
                return done(e)
            }

        });


    });

    it('should return a succesful response with a payroll report when provided with a valid .csv file', (done) => {
        
        var validCSV = path.resolve('tests/controllers/timefile/test_assets') + '/valid.csv';

        request(app)
        .post('/timefile')
        .attach('timefile', validCSV)
        .end((err, res) => {

            if (err) return done(err);
            // Attempt to log employee hours twice:
            try {
                expect(res.error).to.be.false; 
                expect(res.status).to.equal(200);
                return done();
            } catch (e) {
                return done(e)
            }

        });
    });



});


