const express = require('express');
const path = require('path');
const app = express();

/*
    *** IMPORTANT: In a real production environment, the environment variables would get set on the host directly rather than from a file (eg Heroku allows you to specify environment variables when deploying your app)
                   With a fully deployed app, the .env file would be used to load development configurations, and the host would load production configurations
                   
                   However, this app only runs on localhost, so we make an exception and load production configuration environment variables from a local .env file.
                   Development and test configurations are loaded from .json files located in the config folder
*/

if (process.env.NODE_ENV === 'production') {
    require('dotenv').config({path: path.resolve('source.env')});
}

const config = require('./app/config');
const controllers = require('./app/controllers');
const error = require('./app/error');
const filemanager = require('./app/filemanager')
const requestLogger = require('./app/logger/request_logger')

// set the port we're listening on 
app.set('port', config.port);



// set directory of views 
app.set('views', path.join(__dirname, '/app/views'));

// set our view engine to ejs to allow for dynamic templating
app.set('view engine', 'ejs');

// mount file cleanup middleware
app.use('/', filemanager.fileCleanup);

// mount file retrieval middleware
app.use('/', filemanager.fileRetriever);

// mount the logger middleware to get request info logged for all requests
app.use('/', requestLogger);

// mount the homepage router controller methods 
app.use('/', controllers.homepage.router);

//mount the timefile post router controller methods
app.use('/timefile', controllers.timefile.router);

// mounting the error handler middleware at the very end allows us to take error management logic out of controller functions... 
// ... and instead move it into separate middleware that the app's can pass control to upon receiving an error
app.use('/', error.handler);


// listen in on the specified port
app.listen(app.get('port'), () => {
   console.log("Payroll server listening in on port: ", app.get('port')); 
});

module.exports = app;