const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

router.use(viewController.alert);

// router.use(authController.isLoggedIn);

// router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);
router.get('/', authController.isLoggedIn, viewController.getOverview);
// router.get('/tour/:slug',authController.protect , viewController.getTour);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

//one problem is that this protect middleware is very similar to the isLoggedIn, so we will actually do some duplicate operations there, which is not ideal
//bcoz the loggedIn will run for all requests, so we'll individually pass the loggedIn controller in above routes which are not protected
router.get('/me', authController.protect, viewController.getAccount);
// router.get('/my-tours', bookingController.createBookingCheckout, authController.protect, viewController.getMyTours);
router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post('/submit-user-data', authController.protect, viewController.updateUserData)

module.exports = router;