const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload images only.', 400), false);
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
])

// upload.single('image');  req.file       //single image
// upload.array('images', 5); req.files    //multiple with the same name

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  //1) Cover image
  // const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  // await sharp(req.files.imageCover[0].buffer)
  //   .resize(2000, 1333)
  //   .toFormat('jpeg')
  //   .jpeg({ quality: 90 })
  //   .toFile(`public/img/tours/${imageCoverFilename}`);

  // //imageCover is the name we have in our schema definition
  // req.body.imageCover = imageCoverFilename;

  //OR------

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //Other images
  req.body.images = [];

  // req.files.images.foreach(async (file, i) => {
  //we used map so that we can basically save the three promises which are the result of these three async functions below,
  //so, we can await all of them using Promise.all
  await Promise.all(req.files.images.map(async (file, i) => {   //since this async await will not work in foreach loop
    //we need this filename bcoz we need to push it into req.body.images
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
      
    req.body.images.push(filename);
  }));

  // console.log(req.body);
  next();
});

//pre-filling the query string for the user so that the user doesn't have to do it on his own
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}


//GET all tours
// exports.getAllTours = catchAsync(async (req, res, next) => {    //(req, res) is the function, which we call route handler here
//   //EXECUTE A QUERY
//   //all of these chaining here only works bcoz after calling each of these methods, we always return this
//   const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
//   const tours = await features.query;

//   //second way
//   //here, we are chaining some special mongoose method to basically built the query similar to one above
//   // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')

//   //here, i have not added 404(not found) request bcoz here, the db searched correctly and found the 0 records, so basically, it is not an error
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,    //whenever there is an array with multiple object
//     data: {
//       tours
//     }
//   })
// })

exports.getAllTours = factory.getAll(Tour);


//GET single tour
// exports.getTour = catchAsync(async (req, res, next) => {
//   // const id = req.params.id;
//   // const tour = await Tour.findById(req.params.id);

//   //we are using populate in order to replace the fields that we referenced with actual related data & the result will look as the data is always been embedded
//   //populate process always happen in query; also, populate will fill up our data but only in the query and not in actual db
//   //also, we'll specify the name of the field which we want to populate
//   // const tour = await Tour.findById(req.params.id).populate('guides');

//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   //   .populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt'   //to select the particular fields only
//   // });

//   //Tour.findOne({ _id: req.params.id })    //similar to above line

//   if (!tour) {
//     //add return bcoz we want to return this function immediately & not move to next line as it will give multiple responses
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   })
// });

//path property is the field that we want to populate and we can specify select to see which of the field we want to get
// exports.getTour = factory.getOne(Tour, { path: 'reviews', select: '' });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });


//CREATE new tour
//so, createTour here should really be function & not the result of calling a function
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);    //req.body will pass in the real data
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   })

// 

// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err
//   })
// }
// });

exports.createTour = factory.createOne(Tour);


//UPDATE new tour
// exports.updateTour = catchAsync(async (req, res, next) => {
//   //fist param will find the data by id, and second param will update the data which we want to update
//   //also, we can pass the third arg and set it to true and this way the new updated document will be the one that will be returned
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,   //returns the modified document rather than the original
//     runValidators: true    //validate the update operation's against the model schema
//   })

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   })
// })

//coming from handler factory file
exports.updateTour = factory.updateOne(Tour);


//DELETE tour
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: tour
//   })
// })

exports.deleteTour = factory.deleteOne(Tour);


//GET tour stats
exports.getTourStats = catchAsync(async (req, res, next) => {
  //in aggregations, we can manipulate the data in couple of different steps and each of the stage is an object shown below
  //.find is gonna return a query and .aggregate is gonna return the aggregate object, so we need to "await" them to come back with result
  const stats = await Tour.aggregate([
    {
      //match is used to select a document
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      //it allows us to group document together using accumulators; eg. we can calculate the average rating using group
      $group: {
        //here, id is not exactly the mongoDB id, but to specify what we want to use to grp our documents
        // _id: null,    //for now, it's null here bcoz we want to have everything in one grp so that we can calculate the statistics for all of the tours together, & not separate it by the grps
        // _id: '$difficulty',
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },    //for each of the document that's gonna go through this pipeline, one will be added to this num counter
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },    //$avg is the mongoDB operator
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    },
    // //we can repeat stages here
    // {
    //   //here, we are selecting by id and the id here is the difficulty as mentioned above
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  })

})


//GET monthly plan
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;

  const plan = await Tour.aggregate([
    {
      //unwind will deconstruct an array field from the input documents and then o/p one document for each element of the array
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      //project will hide the fields which we don't want to show; it will have value only 0 or 1
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 6
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  })
})


exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');    //bcoz its a string separated by comma

  //in order to get the radius into radians, we need to divide the distance by the radius of the earth
  //this conversion is necessary bcoz mongodb expects the radius of the sphere in radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // console.log(radius);

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }

  // console.log(distance, lat, lng, unit);

  //geoWithin is the geo special operator which finds document within a certain geometry
  //centerSphere operator takes in an array of the coordinates and of the radius
  //here, we need to specify longitude first and then latitude, bcoz thats how it works in geo adjacent
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})


exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }

  const distances = await Tour.aggregate([
    {
      //geospatial aggregation has one single stage which is called geoNear and it should always be the first stage in pipeline
      //another imp thing to note about geoNear is that it requires at least one of our fields contains a geospatial index
      //so if there's only one field with geospatial index, then this geoNear stage here will automatically use that index in order to perform calculation
      //but if we have multiple field with geospatial indexes, then we need to use the keys parameter in order to define the field that we want to use for calculations
      //so here, we have one field(startLocation) which is going to be doing that calculation
      $geoNear: {
        near: {
          //we need to specify this point here as geojson
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        // distanceMultiplier: 0.001
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,    //1 shows that we are sorting by distance
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})