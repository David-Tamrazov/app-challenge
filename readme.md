
How to build the application: 

Setting up the database:

1. Navigate to ./se-challenge-payroll/db_setup
2. With mysql installed and a root user set up, open up a terminal and run the command:

	 'bash setup_database.bash [arg1] [arg2] [arg3]'
		[arg1] : the name of the database you wish to create; use 'payroll_schema', or provide your own name and modify 'DBNAME' within the source.env file located in the project directory
		[arg2] : the name of the database user you wish to create; use 'wave_user', or provide your own name and modify 'DBUSER' within the source.env file located in the project directory
		[arg3] : the password for the database user you wish to create; use 'wave_user8369', or provide your own name and modify 'DBPASS' within the source.env file located in the project directory. 
	
	The script will prompt you for your mysql root password: enter it, and the script will setup the database to the provided configurations. 

3. Either in mysql terminal, or through an interface (eg MySQLWorkbench), run the two 'CREATE TABLE...' commands located within the 'create_tables.sql' file. 
	*** BE SURE TO FIRST CREATE the 'timefiles' table, as 'payroll_report' has a foreign key dependency on 'timefiles'*** 
      

The database should now be set up. 

If you used any arguments other than the 3 recommended in the database setup guide, be sure to modify the 'source.env' file accordingly, or else the application will fail to connect to the database. 



Setting up & Running the Application:


Ensure that node.js is installed on the machine intended to run the app. If not, instructions on how to do so can be found here: https://nodejs.org/en/download/package-manager/

With node installed, open a terminal window and navitage to the '.../se-challenge-payroll' directory, and run the command:
	
	npm install

This will install all of the open source dependencies of the application. 

To startup the node application, open a terminal and, while still in the './se-challenge-payroll' directory, run the command:
	
	 NODE_ENV=production node server.js 

The server will startup and log in the console: 'Payroll server listening on port: 3000'

Thats it! The application is now up and running. Navigate to 'localhost:3000' and you should see the payroll webpage ready to accept csv file submission. 



How to use the application:


The application automatically pulls the payroll report from the server when reaching the home page, and displays it in a table. If no table is seen, this means there is no report stored in the database. 

Submit a csv with a valid format using the interface and web app will store it in the database, returing the newly-calculated payroll report and a refreshing the page to display it. 
	If a server-side error occurs, the server will notify the application as such. 
	If an invalid file format is submitted (.jpg, .txt, etc), the server will return a "Bad Request" response, notifying the client of an invalid file format. 
	If a .csv file thats not formatted according to the project specifications is submitted, the server will return a "Bad Request" response. 
	If the same .csv file is submitted twice, the server will return a "Bad Request" response. 
	If a .csv file that overwrites data from previous files is submitted (i.e. different report_id, but with data for an employee_id.date combination that has already been stored from a previous submission,  the server will return a "Bad request" error with a message notifying the client that they're attempting to overwrite data they've already submitted before. 
		This is intended to ensure no accidental overwrites occur on part of the client; in future releases, a different interfaces would be implemented to update the Timefile information for an employee at a particular date.



Serverside application description: 

./server.js - reads in the .env file and mounts all of the global routes and middleware, including the logger, error middleware, multipart form data reader, as well as the route handlers for the Homepage and Timefile controllers. 


./app/config - configuration directory, contains the hostname and port of the node.js application, as well as the configurations for the mysql database such as the database hostname, database name, the database user, and their password 
	- If the app is run in production mode, these variables are set by the .env file loaded in ./server.js
	- Otherwise, depending on the NODE_ENV environment variable set upon app startup, the configurations are loaded from one of the two .json files in the directory


./app/controllers - directory for application controllers; request routes are mounted, processed, and responded to by these controllers. The controllers delegate data processing, formatting, and management to model objects and respond to the client accordingly based on the returns from the model 
	
	./app/controllers/timefile - directory for the timefile controller. This controller handles timefile submission requests, parsing the submitted timefiles, storing them in the database, and responding to the client accordingly (i.e. positively upon success, negatively if given an invalid submission or a server error occured
	./app/controllers/homepage - directory for the homepage controller. This controller pulls the payroll report from the database and returns it to the client upon navigating to the homepage. When a timefile is submitted and processed, the homepage is reloaded and the new report is sent back for display 


./app/db - directory containing the mysql database connection object for executing database queries, and the knex object that builds the queries


./app/error - directory that contains the error handler middleware that processes all application errors and responds to the client accordingly. The directory also contains the file with generic error declarations that get returned to the client to help keep the server a blackbox.


./app/filemanager - directory that contains the file retrieval middleware used to read in multipart form data from requests, as well as middleware for cleaning up any temporary files left over after a client request has been responded to. 


./app/helpers - directory that contains a file of miscellaneous helper functions used by application models to perform their tasks.


./app/logger - directory that contains the application logger, and logger middleware that logs each request the server receives 


./app/models - directory that contains the application models. These models perform the necessary crud and data processing for each client request, returning data and success/failure information to the controller who can then respond accordingly to the client
	
	./app/models/timefile - directory that houses the model responsible for all Timefile crud and data processing. This model reformats each row of a submitted Timefile for database storage, stores the Timefile, and retrieves Timefile data for the PayrollReport model to use in creating a new payroll
	
	./app/models/payroll - directory that houses the model responsible for using Timefile data stored in the database to process, store, and return a PayrollReport
	
	./app/models/file-row - directory that houses the model responsible for validating that each row of a submitted Timefile is correctly formatted. 


./app/tmp - directory where the submitted timefiles get temporarily stored for processing. filemanager middleware empties the directory one a response has been sent to the client

./app/views - directory that contains the .ejs view file for the web app. The view is rendered and sent to the client by the homepage controller. 

./logs - directory that contains app logs recorded by the logger

./node_modules - directory that contains all open-source frameworks used in the application. This is filled out by the Node Package Manager using the application's package.json file.

./tests - directory housing all tests written for the application

./source.env - .env file containing the application's environment variables used in production mode.



I am particularly happy with how well I spread out concerns in the app. I leveraged an MVC architecture, middleware, and extensive function wrappers to take each major functionality in a database file processing application such as this and spread it out to a separate module. This not only keeps my code readable, so that the top levels could read as close to pseudocode as possible, but it makes the app modular, flexible, and easily adaptable. If I decide I want to send .txt instead of .csv files, I can simply change the file reader object within the “parseTimefile(…)” middleware without touching any other part of the application. All of the multipart form reading and parsing has been extracted to middleware that simply attaches a timefile JSON object to the request body. Now if at some point I decide that instead of sending files, I just want to send JSON directly to the server, I can simply extract the file processing middleware out of the Timefile POST route and the app would still function the exact same. Even error management has been simplified down to logging the error, and passing an instantiated generic to the single error management middleware. 
 
Controllers also can't directly access database- they must access data and trigger processing through wrapper methods implemented within Model files. The model files themselves implement their chief functionalities through a combination of small methods that individually manage one small part of the data processing so all data management is clean, readable, and easy to maintain. Future releases of the application could take this a step further, and completely abstract database querying out of the model files and delegate it to database access objects (i.e. have a  ‘./app/database-access-objects/‘ directory that contains a ‘TimefileAccessObject.js’,’PayrollReport.js’ file, etc.). The models would then access the database through generic function wrappers that would internally query whichever db connection the application uses and return the data to the models. This would keep data processing and retrieval/storage completely separate, so that if down the road I decide I want to use MongoDB or Couchbase as my database, I can easily do so with minimal refactoring. 
