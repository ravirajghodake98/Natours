//everything related to server(or stuff like database configuration, error handling, environment variables...) will come in this file

const mongoose = require('mongoose');
const dotenv = require('dotenv');


//UNCAUGHT EXCEPTION
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
})

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {    //this con(connection) here, will be the resolved value for promise
    console.log('DB connection successful');
})

const app = require('./app');     //we are using the './' to say that we are in the current folder

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`)
})


//To handle unhandled rejection
process.on('unhandledRejection', err => {
  console.log('UNHANDLER REJECTION! shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
})


//SIGTERM is an event(or signal) in hiroku that is used to cause a program to really stop running.
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated.')
  })
})