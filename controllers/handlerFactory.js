//factory function is the function which returns another function
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//we'll pass the model into this function and then we create a new function & that function will return our async function
//this works bcoz of the JS closure; which is that this inner function here will get access to the varibles of the outer function, even after the outer fn has already been returned
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.updateOne = Model => catchAsync(async (req, res, next) => {
  //whenever we use findByIdAndUpdate, all the save middleware will not run
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  })
});


exports.createOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: doc
    }
  })
});


//instead of simply passing the model, we'll pass the populate option too
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  //we'll first create a query and if there is a popOptions object is available, we'll add that to query and by end, we'll await that query
  let query = Model.findById(req.params.id);
  if (popOptions) query = query.populate(popOptions);
  //this logic that we have above with not awaiting the query, but instead saving it in the variable, so that in next step, we can manipulate it
  const doc = await query;

  // const doc = await Model.findById(req.params.id).populate('reviews');

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  })
});


exports.getAll = Model => catchAsync(async (req, res, next) => {
  // Tp allow for nested GET reviews on tour (hack)
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  //the above filter will then pass it in here
  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //mongo automatically creates an index on the id field by default itself
  // const doc = await features.query.explain();
  const doc = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: doc.length,
    data: {
      data: doc
    }
  })
})