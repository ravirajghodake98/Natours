const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');   //necessary for embedding only

//everything which is not in our schema will be ignored simply when we put extra data in our postman
//validator is just a simple function which should return either true or false

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],    //it is a validator
    unique: true,   //it will produce an error when we have a duplicate name, but it is not a VALIDATOR
    trim: true,
    //validators only availabe on strings
    maxlength: [40, 'A tour name must have less than or equal to 40 characters'],
    minlength: [5, 'A tour name must have more than or equal to 5 characters'],
    // validate: [validator.isAlpha, 'Tour name must only contain characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    //enum will allow only these values, and it is only for strings, not for numbers
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    //validators for numbers and dates
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    //sets the callback function, which receives the current value and returns the rounded value
    set: val => Math.round(val * 10) / 10   //but the problem with Math.round is it rounds value to integer
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    //custom validator
    validate: {
      validator: function (val) {
        //this only points to current doc on NEW document creation
        return val < this.price;
      },
      //here, we can have access to the value in above function bcoz of mongoose; it has nothing to do with js
      message: 'Discount price ({VALUE}) should be below the real price'
    }
  },
  summary: {
    type: String,
    trim: true,    //trim only works for string; which will remove all the white space in the beginning and in the end
    required: [true, 'A tour must have a summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,     //Date is Js built-in datatype
    default: Date.now(),
    select: false   //this will simply hide this field from the client
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //GeoJSON: in order to specify geospecial data
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],   //array of numbers, with longitude first and latitude second; but in google maps 1st latitude & then longitude
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  // guides: Array    //for embeding purpose
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'   //User is the schema name 
    }
  ]
},    //this first object is the schema definition
  {     //this second object is for the options
    toJSON: { virtuals: true },    //each time the data is outputted as JSON, we want virtuals to be true
    toObject: { virtuals: true }
  })


//we can set our own indexes on fields, that we query very often, so here we are going to set for the price
//1 means we are sorting in ascending order while -1 means in descending order
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//in order to do geo special queries, we need to first attribute an index to the field where the geospecial data that we are searching for is stored
//so here, we need to add an index to start location
//now we are not setting to 1 or -1, bcoz this time, we'll need the 2D sphere index, if the data describes the real points
//on the earth like sphere for geospecial data
tourSchema.index({ startLocation: '2dsphere' });

//how do we decide on which field we actually need to set the index & why don't we set the index to all the fields??


//VIRTUAL PROPERTIES
//virtual properties are basically fields that we can define on our schema but it will not be persisted(not be saved in our db)
//we are calling get method bcoz this virtual property here will basically be created each time that we get some data out of db
//we are using this regular function here, bcoz the arrow function does not have its own this keyword
//& here, we need this keyword bcoz it is pointing the current document
//also, it will not by default shown into our db, we need to mention it in our schema first as shown above
//we cannot use this virtual property in a query bcoz it is not a part of the db
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
})

//virtual populate
//1st arg is the name of the virtual field
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})


//#MIDDLEWARES
//1)DOCUMENT MIDDLEWARE: runs before only* .save() and .create(); but not on insertMany() or anything else
//this if for pre middleware which is gonna run before an actual event(which is save event)
tourSchema.pre('save', function (next) {    //this function will be called before an actual doc will saved in a db
  // console.log(this);    //in order to trigger this function, we need to run a save or create command
  //slug is basically just a string that we can put in the URL, usually based on some string like the name
  this.slug = slugify(this.name, { lower: true });
  next();
})

//EMBEDDING for tour guides
//this will only work for creating new documents
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// })

// tourSchema.pre('save', function (next) {
//   console.log('will save document...');
//   next();
// })

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// })


//2) QUERY MIDDLEWARE
//here, instead of save, we are using find
// tourSchema.pre('find', function (next) {
//   //this kw will now point to the current query and not the current document bcoz we are processing the query
//   this.find({ secretTour: { $ne: true } });   //we are using this $ne field bcoz the other tours are not currently set to false
//   next();
// })
//but by using the above method, the filter we built in the middleware is not working for this command, that's bcoz
//the handler function for this route is using findById, which behind the scenes is actually findOne;
//so we need to specify the same middleware also for findOne

//there are two ways and first one is  1)simply using findOne instead of find but that's also not good
// tourSchema.pre('findOne', function () {
//   this.find({ secretTour: { $ne: true } });
//   next();
// })

//instead, we'll use second method; 2)by using REGEX
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();    //time when query starts
  next();
})

//all queries will automatically populate the guides field with the referenced user
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
})

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);    //time taken by query to finish
//   // console.log(docs);
//   next();
// })


//3)AGGREGATION MIDDLEWARES
//we could simply go to the aggregation in getTourStats, and in match state simply exclude the secret tours that are true
//but we have to manually do it for other aggregations too, and that is hectic and also it is a repetitive code
//we will exclude it here at the model level
// tourSchema.pre('aggregate', function (next) {
//   //since, this is an array, and we use unshift method to add the elements in the beginning of the array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// })


const Tour = mongoose.model('Tour', tourSchema);    //always use uppercase for model names and variables

module.exports = Tour;