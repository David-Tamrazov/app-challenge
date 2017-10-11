const path = require('path');
const FileRow = require(path.resolve('app', 'models')).FileRow;
const expect = require('chai').expect;


describe('FileRow schema validator', () => {

    it('should return true when passed a correctly formatted row object', () => {

        var validRow = {
            "hours worked": 10.0, 
            "job group": "B", 
            "employee id": '12', 
            "date": "14/12/2015"
        }

        var validationResult = FileRow.validRow(validRow);

        expect(validationResult).to.be.true;

    });

    it('should return false when passed an incorrectly formatted row object', () => {

        var invalidDateRow = {
            "hours worked": 10, 
            "job group": "B", 
            "employee id": '12', 
            "date": 12.5
        }

        var validationResult = FileRow.validRow(invalidDateRow);

        expect(validationResult).to.be.false;

        
        var invalidJGRow = {
            "hours worked": 10, 
            "job group": "C", 
            "employee id": '12', 
            "date": "14/12/2015"
        }

        validationResult = FileRow.validRow(invalidDateRow);
        
        expect(validationResult).to.be.false;

        
        var invalidEIDRow = {
            "hours worked": 10, 
            "job group": "C", 
            "employee id": 12, 
            "date": "14/12/2015"
        }

        validationResult = FileRow.validRow(invalidDateRow);
        
        expect(validationResult).to.be.false;


        var invalidHWRow = {

            "hours worked": 'wrong',
            "job group": "C",
            "employee id": 12,
            "date": 12
        }


        validationResult = FileRow.validRow(invalidDateRow);

        expect(validationResult).to.be.false;

    });

});


