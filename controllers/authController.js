const jwt = require('jsonwebtoken');
const crypto = require('crypto');
//instead of importing whole utility function, we'll destructure what we need as per ES6
// const util = require('util');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// const sendEmail = require('./../utils/email');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}


const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id)

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true,   //cookie will only be sent in encryption connection if only it is in production
    httpOnly: true,     //the cookie cannot be accessed or modified in any way by the browser

    //this is how we check if the connection is secure or not, when app is deployed to heroku
    //req.secure doesn't work in the first place bcoz heroku acts as proxy which redirects & modifies incoming requests
    //so we need to send trust proxy in app.js
    secure: req.secure || req.headers['x-forwareded-proto'] === 'https'
  }

  // we need to change this, bcoz all deployed apps are not set to https by default
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //only connection is secure then this req.secure is true
  //req.headers['x-forwareded-proto'] === 'https'; to test in 'heroku'
  // refactored above after http:true
  // if (req.secure || req.headers['x-forwareded-proto'] === 'https') cookieOptions.secure = true;

  //jwt is the name of the cookie; data that we want to send in the cookie is token variable
  res.cookie('jwt', token, cookieOptions)

  //Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
}


exports.signup = catchAsync(async (req, res, next) => {
  //there is a very serious security flaw in this way of signing up users, so basically the problem is
  //right now, we create a new user by using all the data that is coming in with the body & the problem here is
  //like this, anyone can specify his role as admin
  // const newUser = await User.create(req.body);

  //so the solution is: the difference here is with this new code we only allow the data that we actually need 
  //to be put into the new user, so if user manually tries to enter a role, we'll not store that into newUser
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  //   // passwordChangedAt: req.body.passwordChangedAt,
  //   role: req.body.role
  // })

  const newUser = await User.create(req.body);
  // const url = 'http://127.0.0.1:3000/me';    //this will only work in development env
  const url = `${req.protocol}://${req.get('host')}/me`;       //on production
  // console.log(url);

  await new Email(newUser, url).sendWelcome();


  //1st arg is the payload which we need to pass
  //2nd arg is the string for our secret
  //3rd arg is the expiration time of the jwt token
  // jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // })

  createSendToken(newUser, 201, req, res);
  // const token = signToken(newUser._id)
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // })
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email & password', 400));
  }

  //2) check if user exists and password is correct
  //when we want a field that is by default not selected, we need to use '+' and then the name of the field
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);
  //it is an instance method taken from the user model
  //there are two problems: 1) since this correctPassword is an asynchronous function, we need to use await
  //if the user does not exist(as mentioned in above line, then this below line won't work, so we'll move the below line directly in condition)
  // const correct = user.correctPassword(password, user.password);

  //we could have verified it separately but this will give the advantage for the attacker to know what exactly is wrong
  // if(!user || !correct) {
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401))
  }

  //3) if everything ok, send token to client

  const token = signToken(user._id);
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // })
});


exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  res.status(200).json({ status: 'success' });
}


exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it exists
  //to do this, common practice is to send a token using http header with the request
  let token;
  //here, we are only reading the jwt from the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //since it is a block scope, we cannot access it outside
    // const token = req.headers.authorization.split(' ')[1];
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // authenticate users based on tokens sent via cookies
    token = req.cookies.jwt;
  }
  // console.log(token);

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  //2) Verification(validate) token
  //1st arg is payload(or token); this step also needs the secret in order to create the test signature
  //3rd arg is callback & this callback will run as soon as the verification has been completed
  //we will use promisify function here & node actually has a built in promisify function
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // console.log(decoded);

  //3) check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belonging to this token does no longer exists', 401))
  }

  //4) check if user changed password after the JWT(or token) is issued
  // freshUser.changedPasswordAfter(decoded.iat)
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password. Please login again.', 401))
  }

  //to put entire user data on the request
  req.user = freshUser
  res.locals.user = freshUser

  //Grant access to protected routes
  next();
})


//this middleware is used for only rendered pages; and there should not be any error
//we are removing catchasync here bcoz we do not want to catch any async errors; instead we want to catch them locally and if there's error, simply say next
// exports.isLoggedIn = catchAsync(async (req, res, next) => {
exports.isLoggedIn = async (req, res, next) => {
  try {
    //to execute all the code if there is a cookie called jwt
    if (req.cookies.jwt) {
      //1) verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

      //2) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();    //there will not be any error, we'll simply move on to the next middleware
      }

      //3) check if user changed password after the JWT(or token) is issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user, so we want to make that user accessible to the template by doing res.locals
      res.locals.user = currentUser;    //user is a variable here
      return next();
    }
  } catch (err) {
    return next();
  }
  //in case there is no cookie, the next middleware will be called right away
  next();
};


//usually, we cannot pass arguments into the middleware function, so to pass the roles, we'll create the wrapper function 
//which will then return the middleware function that we want to create, so we'll use the REST parameter syntax
exports.restrictTo = (...roles) => {
  //so we created this function and right away we returned a new function which is a middleware function itself
  //bcoz of the closure, the below function will have access to roles
  return (req, res, next) => {
    //roles is an array ['admin', 'lead-guide']
    //this role is stored in the 'protect' API from where we are accessing
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))   //403-forbidden
    }

    next();
  }
}


exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //to save passwordResetExpires
  //validateBeforeSave will deactivate all the validators that we specified in our schema
  await user.save({ validateBeforeSave: false });

  //3) Send it to user's email
  //we are going to send plain original reset token here and not the encrypted one & in the next step we'll compare the
  //original token with encrypted one
  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\n
  // If you didn't forgot your password, then please ignore this email!`;

  //sendEmail is an asynchronous function which will return the promise, so we need to await it
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token(valid for 10 minutes)',
    //   message
    // })

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    })
  } catch (err) {
    //by setting to undefined, it will delete that property
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
})


exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  //querying the db for this token
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  //2) Set the new password, if token has not expired, and there is a user
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //if there is no error and next is not called, then we'll set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //to delete the reset token and the expired
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //now, we need to save it bcoz it will just modify the data but won't save it
  await user.save();

  //3) Update the changedPasswordAt property for the current user
  //this is done in the userModel middleware

  //4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // })
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401))
  }

  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate is not gonna work, therefore we didn't use this bcoz of
  //1)in userModel, in passwordConfirm field, the validator is not going to work bcoz this.password is not defined, when we update
  //2) the two pre middleware in userModel will also not work, as the password won't be encrypted and timestamp will also not be saved

  //4) Log user in, send JWT
  createSendToken(user, 200, req, res);
})