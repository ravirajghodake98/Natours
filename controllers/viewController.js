const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alert = catchAsync(async (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking')
    res.locals.alert = 'Your booking was successful! Please check your email for confirmation. If your booking doesn\'t show up immediately, please come back again later.'

  next();
})

exports.getOverview = catchAsync(async (req, res) => {
  //1) Get tour data from collection
  const tours = await Tour.find();

  //2) Build template

  //3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get the data for the requested tour(including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      field: 'review rating user'
    })

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  //2) Build template

  //3) Render template using data from step 1
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour
    })
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  })
}

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account'
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2) find tour with the returned Id's
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours
  })
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    });

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  })
});