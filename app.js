//this app.js file is mainly used for middleware declarations(everything related to express)

const path = require('path');     //path is a built in core module which is used to manipulate path names
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');   //for setting security http headers
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');    //parse all the cookies from incoming request
const compression = require('compression');       //to compress the text
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

//to read the value of req.secure in authController
app.enable('trust proxy')

// to tell the express, what template engine we are using
//we don't need to install or require it as express automatically does it behind the scenes
app.set('view engine', 'pug');

//we defined our view engine, now we also need to define where these views are actually located in our file system
// pug templates are actually called views in express, bcoz we are using MVC architecture
//the path that we provide here is always relative to the directory from where we launch our node application
// app.set('views', './views');   //so we should use the directory name variable
app.set('views', path.join(__dirname, 'views'));


// GLOBAL MIDDLEWARES
//Implementing CORS
//will set for all the requests: Access-Control-Allow-Origin *
app.use(cors());

//if backend is at api.natous.com & front-end at natours.com
// app.use(cors({
//   origin: 'http://www.natours.com'
// }))

//it is another http method that we can respond to
//1st arg is all the routes, and 2nd arg is handler
app.options('*', cors())
// app.options('/api/v1/tours/:id', cors())     //example

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
app.use(helmet());

//Development logging
// console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,    //requests per IP we are going to allow in certain amout of time 
  windowMs: 60 * 60 * 1000,    //requests per time in milliseconds
  message: 'Too many requests from this IP. Please try again in an hour!'
})
app.use('/api', limiter)

//we are doing this here instead of route file, bcoz when we receive the body from stripe, the stripe function that we are then gonna use
//to actually read the body needs this body in a raw form(as string and not json) otherwise it won't work
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout);

// app.use(morgan('dev'));

//BODY parser
app.use(express.json({ limit: '10kb' }));
//the way the form sends data to the server is URL encoded, & here, we need that middleware to parse data coming from URL encoded form
//extended:true will allow us to parse some more complex data
app.use(express.urlencoded({extended:true,limit:'10kb'}));    
app.use(cookieParser());    //parses the data from the cookie

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS(cross site scripting) attack
app.use(xss());

//Prevent parameter pollution: it means if multiple fields are given in params, it will consider only the last one
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

//return a middleware function which is going to compress all the text that is sent to clients(will compress only text)
app.use(compression());


//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
})

// app.get('/', (req, res) => {       //route to access the base.pug template
//   res.status(200).render('base', {    //to pass data into this template and that data will then be available in pug template
//     tour: 'The Forest Hiker',
//     user: 'Jonas'
//   })
// })

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours'
//   })
// })

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour'
//   })
// })

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404))
})

app.use(globalErrorHandler);

module.exports = app;