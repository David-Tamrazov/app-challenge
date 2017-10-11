const winston = require('winston');

const path = require('path');

const pathToLog = path.resolve('logs') + '/payroll-app-error.log';

// remove the default console.log transport 
winston.remove(winston.transports.Console);

var logger =  new (winston.Logger)({
  transports : [
    new (winston.transports.File)({
      name: 'error-logs', 
      filename: pathToLog, 
      level: 'error', 
      colorize: true,
      handleExceptions: true, 
      timestamp: true,
  })
  ]
});

var log = (obj) => {
  logger.error(obj);
}

module.exports = {
  log,
};