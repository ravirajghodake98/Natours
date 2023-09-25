// we are passing a stripe secret key right here, which will then give us a stripe object that we can work with
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);    //this npm package only works for backend

const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session
  //information about the session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],    //array of payment methods and card is for credit card

    // success_url: `${req.protocol}://${req.get('host')}/`,    //url that will get called as soon as the credit card has been successfully charged(user will be redirected to this url)
    //we need to create a query string to below url bcoz stripe will just make a get request to this url here, so we cannot send any data with body except the query string
    //this is not secure at all bcoz anyone who knows the url structure could simply call it w/o going through the checkout process
    //means anyone can book a tour w/o even paying
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,

    // success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,

    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,   //so that user doesn't need to fill in checkout
    //this field will allow us to pass in some data that we are currently creating, and it's imp bcoz once the purchase was successful, we'll get access to session object again
    client_reference_id: req.params.tourId,

    //information about the product
    line_items: [
      {
        //all these field names(name, description,... comes from stripe, we cannot make up our own fields)
        // name: `${tour.name} Tour`,
        // description: tour.summary,
        // //these array of images should be the live images(hosted on internet) bcoz stripe will upload them to their own server
        // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        // amount: tour.price * 100,    //bcoz the amount is in cent/paise
        // currency: 'usd',
        // quantity: 1,

        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,    //bcoz the amount is in cent/paise
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  })

  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  })
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only TEMPORARY, bcoz it's UNSECURE; everyone can make booking w/o paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   //to make the url(success_url) more secure, we'll remove(or hide) the query string from it
//   //redirect here will basically create a new request but to this new url that we passed in there
//   res.redirect(req.originalUrl.split('?')[0]);
// })

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  //by wrapping all this in parenthesis and calling id on it will return only the id
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].unit_amount / 100;

  await Booking.create({ tour, user, price });
}

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object)

    res.status(200).json({ received: true });
  }
})

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);