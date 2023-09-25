//we want all of our AppError objects to inherit from the built in error(Error)
class AppError extends Error {
  constructor(message, statusCode) {
    //when we extends a parent class, we call a super in order to call the parent constructor
    super(message);    //message is the only parameter that the built in error accepts

    //here, i didn't set the this.message = message, bcoz we called the parent class(super) above and parent class is error,
    //and whatever we pass into it, is gonna be the msg property

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;    //bcoz all our operational errors will be here(as i saw, two types of error)

    //in first arg, we specify the current object; and in second arg, the appError class itself
    //so, this way when a new object is created & constructor is called, then that function call is not gonna appear in stack trace & not pollute it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;