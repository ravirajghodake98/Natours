const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review cannot be empty']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tour: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to tour']
    }
  ],
  user: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to user']
    }
  ]
},
//we set the virtual property bcoz when we have them(a field that is not stored in db but calculated using some other value)
//so we want this to also show up whenever there is an output
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


//QUERY MIDDLEWARE
//for populating tour and user
// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name'
//   }).populate({
//     path: 'user',
//     select: 'name photo'
//   });
//   next();
// })

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
})

//to set tour and user as unique for the review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });


//STATIC METHOD
//in static method, this kw points towards the current model and that is why we are using the static method here
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // console.log(tourId);
  const stats = await this.aggregate([
    //1st step is to select all the reviews that belong to the current tour that was passed in as argument
    {
      //to select the tour we actually want to update
      $match: { tour: tourId }
    },
    {
      //to calculate the statistics
      $group: {
        //first field is _id and then the common field that all documents have in common that we want to group by
        _id: '$tour',
        nRating: { $sum: 1 },   //since index starts from zero
        avgRating: { $avg: '$rating' }
      }
    }
  ])
  // console.log(stats);

  // //to persist the calculated statistics into the tour document(or into the tour model)
  // //id is the tour id and then the object of the data that we actually want to update
  // //we are not storing the result anywhere bcoz we don't need it anywhere, we just need to update it
  // await Tour.findByIdAndUpdate(tourId, {
  //   // the stats is store in an array, so we need to go to the first position of it
  //   ratingsQuantity: stats[0].nRating,
  //   ratingsAverage: stats[0].avgRating
  // })

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

//we should use post save, bcoz in pre save, the current review is not in the collection yet
// reviewSchema.pre('save', function (next) {
reviewSchema.post('save', function () {   //the post middleware does not get access to next
  //this refers to current review
  //we'll want to call the calcAverageRating function using this.tour

  //here, review model is not yet declared so you might think that we should put this middleware after the second last line
  //but since middleware executes sequentially so it will get executed after the review model is created and so it won't have any effect
  // Review.calcAverageRatings(this.tour);

  //but we can do this by using this.constructor which still points to the model
  //this is the current document and the constructor is the model who created that document
  // this.constructor here stands for the tour which is (this.constructor = Review)
  this.constructor.calcAverageRatings(this.tour);
})

//behind the scene findByIdAndUpdate is only the shorthand for findOneAndUpdate with the current ID
//we cannot set this here to post, bcoz at this point of time we no longer have access to this query bcoz the query has
//already been executed & w/o the query we cannot save the review document & we can then not run this(calcAverageRatings) function
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // const r = await this.findOne();
  this.r = await this.findOne();
  // console.log(this.r);
})

//after the query has already been finished, and the review has updated, this is the perfect time to call the calc function
reviewSchema.post(/^findOneAnd/, async function () {
  await this.findOne();   //does NOT work here, query has already executed
  //to get the tourId, we'll use the trick of passing data from pre middleware to post middleware
  //so instead of saving the above function to variable, we'll save to this.r
  await this.r.constructor.calcAverageRatings(this.r.tour);
})


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;