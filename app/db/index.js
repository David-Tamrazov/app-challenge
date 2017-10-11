const config = require('../config');

const knex = require('knex')(config.mysql);

const mysql = require('mysql');



const connection = mysql.createConnection({
    host: config.mysql.connection.host,
    user: config.mysql.connection.user,
    password: config.mysql.connection.password,
    database: config.mysql.connection.database
});


module.exports = {
    knex, 
    connection
}