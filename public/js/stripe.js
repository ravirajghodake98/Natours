import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51Nmy6JSE2cfI0AgJYVF4m8crHWUV4UIphIiD5mmlynQZnpHqbmdT1pBZlVIMLMzMQzcB7XTHdbIHrC2zg3TM61q200uqIbBW2p');

export const bookTour = async tourId => {
  try {
    //1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    //2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};