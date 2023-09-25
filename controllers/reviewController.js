// const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   //initializing the filter to mutate
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   // const reviews = await Review.find();
//   //if it's a regular API call w/o nested route, then the filter will simply be the empty object
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   })
// });

exports.getAllReviews = factory.getAll(Review);


//we are decoupling the tour and user id here from createReviews
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
}

// exports.createReviews = catchAsync(async (req, res) => {
//   //Allow nested routes
//   //if we didn't specify the tourID and body, then we want to define that as the one coming from the URL
//   if (!req.body.tour) req.body.tour = req.params.tourId;

//   //we get the req.user from the protect middleware
//   if (!req.body.user) req.body.user = req.user.id;
  
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview
//     }
//   })
// })


exports.getReview = factory.getOne(Review);
exports.createReviews = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);