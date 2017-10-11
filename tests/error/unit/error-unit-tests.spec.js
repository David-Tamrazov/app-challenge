const expect = require('chai').expect;
const path = require('path');
const error = require(path.resolve('app', 'error'));
const ErrorTypes = error.types;
const handler = error.handler;


describe('custom error creation functions', () => {

    it('should create a custom error object with the provided message', () => {

        var customErr = ErrorTypes.serverError("This is a custom message.");

        expect(customErr.statusCode).to.equal(500);
        expect(customErr.message).to.equal("This is a custom message.");

    });

    it('should create a custom error with a default message', () => {

        var customErr = ErrorTypes.serverError();

        expect(customErr.statusCode).to.equal(500);
        expect(customErr.message).to.equal("Server Error. Please try again later.");

    });

});


