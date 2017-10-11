const Validator = require('jsonschema').Validator;
const logger = require('../../logger').logger;

var v = new Validator();

const rowSchema = {
    'id' : '/FileRow', 
    'type': 'object', 
    'required': ['date', 'employee id', 'hours worked', 'job group'],
    'properties': {
        'date': {
            'type': ['integer', 'string'],
        }, 
        'employee id': {
            'type': 'string', 
            'minimum': 1
        }, 
        'hours worked': {
            'type': 'float', 
            'minimum': 1
        }, 
        'job group': {
            'type': 'string', 
            'enum': [ 'A', 'B', ""]
        }
    }
}

/*
    Method that validates csv rows against our schema to make sure we're only working with data formats that we expect.
*/ 
var validRow = (jsonRow) => {
    var result = v.validate(jsonRow, rowSchema);
    return result.errors.length == 0;
}

module.exports = {
    validRow
}