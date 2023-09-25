const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  // console.log('Handling casting error...');
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
  // const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  // console.log(value)
  //1st method
  // const value = Object.values(err.keyValue)[0];    //Object.values will work with any duplicate field

  //2nd method
  //this is used only if the duplicate field is "name"
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}

//this is a one-liner function, so this will automatically and implicitly return the error
const handleJWTError = () => new AppError('Invalid token. Please login again.', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please login again.', 401);

const sendErrorDev = (err, req, res) => {
  //A)API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    })
  } 

    //B)RENDERED WEBSITE
    console.error('error',err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })

  // res.status(err.statusCode).json({
  //   status: err.status,
  //   error: err,
  //   message: err.message,
  //   stack: err.stack
  // })
}

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
//Operational , trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  } 

  console.error('error',err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    })
}

  // B)RENDERED WEBSITE
 //Operational , trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })
  } 

  console.error('error',err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    })
  }

//   //Operational , trusted error: send message to client
//   if (err.isOperational) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     })

//     //programming or other unknown error: don't leak error details
//   } else {
//     //1)log the error: logging the error to console will make it visible in the logs on the hosting platform that we are using
//     // console.error('Error: ', err);

//     //2) send generic message
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong!'
//     })
//   }

//   // res.status(err.statusCode).json({
//   //   status: err.status,
//   //   message: err.message,
//   // })
// }

module.exports = (err, req, res, next) => {
  // console.log(err.stack);   //stack will show us exactly where the error happen

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //error.name is not showing in the destructuring initially
    //here, i specified that name:err.name manually to log the err.name='CastError' from mongoose
    let error = { ...err, name: err.name };
    //we are assigning error.message=err.message bcoz the operational error is not showing in the rendered page in production environment
    error.message=err.message;

    // console.log(error)    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // console.log(err.message);
    // console.log(error.message);

    sendErrorProd(error, req, res)
  }

  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message
  // })
}