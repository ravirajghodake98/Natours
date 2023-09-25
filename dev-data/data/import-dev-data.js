//this is the file, where we import all data from our json file to database

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => console.log('DB connection successful'));

//Read JSON File
//since it's a Json data, we need to first convert into the js object using JSON.parse
//'./tours-simple.json': the '.' here is always relative from the folder, where the node application is started, so we are basically looking
//for the tours-simple.json file in the home folder
// const tours = JSON.parse(fs.readFileSync('./tours-simple.json', 'utf-8'));
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//Import data into database
const importData = async () => {
  try {
    //create method can also accept an array of objects & it will then simply create a new document for each of the objects in the array
    await Tour.create(tours);
    //validateBeforeSave is used to explicitly turn off the validation
    //aanother thing we need to do is to turn off the password encryption in model as we already have in our db
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully Loaded');
  } catch (err) {
    console.log(err)
  }
  process.exit();
}


//Delete all data from collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  //since after the deletion of the data, the process is still running so we'll stop it by
  //process.exit() should be outside try caatch block and end of the function; so no matter if there is error or not, it will always just exit the process
  process.exit();   //this is an aggressive way of stopping an application but here the script is small and we are not running a real app, so no problem here
}


//condition to delete or insert data through the command line
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}


// console.log(process.argv);
/*
node .\dev-data\data\import-dev-data.js; process.argv will divide this line into an array of two shown below
[
  'C:\\Program Files\\nodejs\\node.exe',    //this is where the node command is located
  'D:\\Node.js\\node-udemy\\4-natours\\dev-data\\data\\import-dev-data.js'    //this is the path to the file
]
these two above are the results of the console.log file, which we have written above for (process.argv)
*/