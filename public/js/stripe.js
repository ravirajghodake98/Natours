import axios from 'axios';
import { showAlert } from './alerts';
//this Stripe is aobject that we get from the script that we just included in tour.pug file
const stripe = Stripe('pk_test_51Nmy6JSE2cfI0AgJYVF4m8crHWUV4UIphIiD5mmlynQZnpHqbmdT1pBZlVIMLMzMQzcB7XTHdbIHrC2zg3TM61q200uqIbBW2p');

export const bookTour = async tourId => {
  try {
    //1) Get checkout session from API
    // const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    //2) Create checkout form + charge credit card
    //stripe object here is simply using the stripe library with our public key
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })

  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};