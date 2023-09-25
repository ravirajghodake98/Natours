// in order to do the HTTP request to the login, we'll use the popular library called axios
import axios from 'axios';

import { showAlert } from './alerts';

export const login = async (email, password) => {    //this login function will take email and password as parameter
  // console.log(email, password)

  try {
    const res = await axios({     //the variable is our result which is res(!response here)
      method: 'POST',
      // url: 'http://127.0.0.1:3000/api/v1/users/login',
      url: '/api/v1/users/login',     //since we are moving this url to production
      data: {
        email,
        password
      }
    })

    //res.data is the data we sent from the json response
    if (res.data.status === 'success') {
      // alert('Logged in successfully');
      showAlert('success', 'Logged in successfully');
      // console.log('suc')
      // to reload the page automatically after logged in
      //NOTE: it will reload when we close the alert
      window.setTimeout(() => {
        location.assign('/');    // '/' is the home route
      }, 500);   //500 is the millisecond
    }
    // console.log(res)
  } catch (err) {
    // console.log(err.response.data);
    // alert(err.response.data.message);
    showAlert('error', err.response.data.message);
    // console.log('err')
  }
}

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      // url: 'http://127.0.0.1:3000/api/v1/users/logout'
      url: '/api/v1/users/logout'
    });
    //location.reload will reload from the server and not the browser cache
    //it's imp to mark it as true otherwise it might load the same page from the cache, which will have the user menu on top
    if (res.data.status = 'success') location.reload(true);
  } catch (err) {
    // console.log(err.response)
    showAlert('error', 'Error logging out! Try again')
  }
}


//this file is to get the data from UI and then delegate the action, so we'll put this piece of code in index.js file
// document.querySelector('.form').addEventListener('submit', e => {
//   e.preventDefault();     //this prevents the form from loading any other page
//   const email = document.getElementById('email').value;   //value property is used to read that value out there
//   const password = document.getElementById('password').value;
//   login(email, password);
// })