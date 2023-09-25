const express = require('express');
// const multer = require('multer');
const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('./../controllers/userController');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//destination folder where we want to save all the images that are being uploaded
//we could have called w/o the destination & then the uploaded img will simply be stored in the memory and not saved anywhere(into our directory in fs)
// const upload = multer({ dest: 'public/img/users' });

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


//since middleware always executes sequentially, so this will protect all the routes which will come after this route
//and this will only call the next middleware if the user is authenticated
//Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
// router.patch('/updateMe', userController.updateMe);

//we are uploading a single image and in that single, we pass the name of the field that is going to hold the image to upload(i.e., photo)
// router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(getAllUsers)
  .post(createUser)

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router;