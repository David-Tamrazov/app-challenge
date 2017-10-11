'use strict';

var exportObject = { };

if (process.env.NODE_ENV === "production") {
    exportObject = {
        host: process.env.HOST || "",
        port: process.env.PORT, 
        mysql: {
            client: process.env.SQLCLIENT,
            connection:{
                host: process.env.DBHOST,
                user: process.env.DBUSER,
                password: process.env.DBPASS,
                database: process.env.DBNAME
            } 
        }
    }
} else if (process.env.NODE_ENV === "testing") {
    exportObject = require('./testing.json');
}
else {
    exportObject = require('./development.json');
}

module.exports = exportObject;