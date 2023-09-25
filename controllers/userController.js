const multer = require('multer');   //image uploading library for nodeJS
const sharp = require('sharp');     //image processing library for nodeJS
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   //this callback function has access to the current request, currently uploaded file and also to the callback function
//   //this cb function is similar to next but we are calling cb here, as it doesn't come from express
//   destination: (req, file, cb) => {
//     //callback(cb) function with no error(null) & the file name which we need to specify
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     //user-userId-date.ext
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

//this way the image will only store as a buffer and the buffer is available at req.file.buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload images only.', 400), false);
  }
}

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // we are doing it like this bcoz right now, the file name is not defined, and we need that filename in other middleware functions
  //since we have changed to format to jpeg, we don't need to specify ${ext}
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //when doing image processing after the file is uploaded, then we don't need to save it to disk, instead save to memory
  //calling the sharp function like this here will create an object on which we can chain multiple process in order to do image processing
  //toFormat is used to convert the images
  //jpeg method is used to compress the image quality and the number(90) is the percentage to compress
  //toFile is used to write it to a file on the disk
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //we are going to loop through all the fields that are in the object
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

//we'll be using the getOne handler function here, but the problem there is the getOne will take id from the params but 
//here, we want to basically get the document based on current userID
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}


// exports.getAllUsers = catchAsync(async(req, res, next) => {
//   const users = await User.find();
  
//   res.status(201).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   })
// });

exports.getAllUsers = factory.getAll(User);


exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  //1)Create error if user post's password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
  }
  
  //2) Filtered out unwanted field names that are not allowed to be updated(name and email)
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  //3)update user document
  //we are not using the save() method here, bcoz there are some fields in the schema which are required but we are not updating it
  // const user = await User.findById(req.user.id);
  // user.name = "Raviraj";
  // await user.save();


  //we can now use findByIdAndUpdate since we are dealing with non sensitive data other than passwords
  //new:true means we'll get the updated object and not the old one
  // we are setting filteredBody instead of req.body here, bcoz we don't want to update every data of the user(eg. role)
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

  return res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})


exports.deleteMe = catchAsync(async (req, res, next) => {
  //we are not actually deleting this user here but simply setting it to inactive
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  })
})


exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! Please use /signUp instead'
  })
}

//Do NOT update password with this
exports.updateUser = factory.updateOne(User);   //only for admin & only for data that is not the password
exports.deleteUser = factory.deleteOne(User);