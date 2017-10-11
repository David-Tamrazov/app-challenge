const path = require('path');

// middleware to parse multiform data from the request and upload it to a temporary directory 
const multer = require('multer');

// directory where multer should upload files read from  multipart form data
const upload = multer({ dest: path.resolve('app', 'tmp') });
const fileRetriever = upload.single('timefile');

module.exports = fileRetriever;
