// assertion library
const expect = require('chai').expect;
const path = require('path');
var assert = require('assert');
const helpers = require(path.resolve('app', 'helpers'));

describe('helper date reversal function', () => {

    it('should reverse the date string going from the database to the client properly', () => {

        var expectedString = '05/06/2017';
        var inputString = '2017-06-05';

        var result = helpers.reverseDateString(inputString, true);

        expect(result).to.equal(expectedString);

    });

    it('should reverse the date string going from the client to the database properly', () => {

        var inputString = '05/06/2017';
        var expectedString = '2017-06-05';

        var result = helpers.reverseDateString(inputString, false);

        expect(result).to.equal(expectedString);

    });
});

describe('helper pay period functions', () => {

    it('should properly calculate whether a given year is a leap year', () => {

        var firstValidLeapYear = helpers.leapYear(2000);
        var secondValidLeapYear = helpers.leapYear(2004);
        var invalidLeapYear = !(helpers.leapYear(2005));

        expect(firstValidLeapYear).to.be.true;
        expect(secondValidLeapYear).to.be.true;
        expect(invalidLeapYear).to.be.true;

    });


    it('should properly determine the end of a pay period given the month and the year', () => {

        var firstPPEnd = helpers.getPayPeriodEnd(2, 2000);
        var secondPPEnd = helpers.getPayPeriodEnd(2, 2001);
        var thirdPPEnd = helpers.getPayPeriodEnd(3, 2000);
        var fourthPPEnd = helpers.getPayPeriodEnd(4, 2000);

        expect(firstPPEnd).to.equal(29);
        expect(secondPPEnd).to.equal(28);
        expect(thirdPPEnd).to.equal(31);
        expect(fourthPPEnd).to.equal(30);

    });


    // it('should return a properly formatted payperiod string', () => {

    //     var earlyDate = new Date(2017, 12, 6);
    //     var lateDate = new Date(2017, 12, 16);

    //     console.log("Testing payperiod now...");

    //     var earlyPayPeriod = helpers.getPayPeriod(earlyDate);
    //     var latePayPeriod = helpers.getPayPeriod(lateDate);

    //     expect(earlyPayPeriod).to.equal("1/12/2017 - 15/12/2017");
    //     expect(latePayPeriod).to.equal("16/12/2017 - 31/12/2017");

    // });
    
});

