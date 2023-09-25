const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');     //to generate random bytes for reset password

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false   //it will not show the password in the output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on SAVE or CREATE(at the time of password creation)
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});


//MIDDLEWARES
//the middleware function that we specify here, so the encryption is gonna be happened b/w the moment that we
//receive the data & the moment where it actually persisted to the db
userSchema.pre('save', async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  //salt a password means adding a random string to the password so that two equal passwords do not generate the same hash
  //12 is the cost parameter; & we can specify a cost parameter in two ways
  //1) to manually generate a salt so that random string is gonna be added to password & then use that salt in hash function
  //2) we can simply pass a cost parameter here which is basically a measure of how CPU intensive this operation will be
  //this hash here is the asynchronous version and this will return a promise
  this.password = await bcrypt.hash(this.password, 12)

  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
})


//again, this function is gonna run right before a new document is actually saved
userSchema.pre('save', function (next) {
  //when we modified the password or if the document is new, at that time only, changedPasswordAt should work
  if (!this.isModified('password') || this.isNew) return next();

  //in theory, this should work just fine but in practical sometimes, a problem happen & that problem is sometimes saving
  //to database is bit slower than issuing JWT, so we'll subtract 1 sec
  this.passwordChangedAt = Date.now() - 1000;
  next();
})


userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: {$ne: false} });
  next();
})



//INSTANCE METHOD
//An instance method is a method that is gonna be available on all documents of a certain collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  //here, this.password will not be available since we have set the password to false in our schema  
  // this.password
  return await bcrypt.compare(candidatePassword, userPassword);
}


userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //10 is the log base here
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // console.log(this.passwordChangedAt, JWTTimestamp);
    // console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }
  //be default, we will return false from this method means user has not change his password after the token was issued
  //FALSE means not changed
  return false;
}


userSchema.methods.createPasswordResetToken = function () {
  //32 is the no. of characters
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  //encrypted the password resetToken
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;