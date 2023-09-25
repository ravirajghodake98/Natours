//polyfill will make some of the newer js features work in older browser as well
import '@babel/polyfill';
import { displayMap } from './mapbox';

//{login} is the name of the function that we export it from login.js file; and curly braces is used bcoz we used simple 'export' instead of module.exports
import { login, logout } from './login';
// import { updateData } from './updateSettings';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour');

//VALUES
//this won't work, bcoz we are trying to read these values in the beginning when the page loads & at this point these values are not defined
// const email = document.getElementById('email').value;
// const password = document.getElementById('password').value;

//DELEGATION
//bcoz we used map only on homepage and not on any other page, so it will show us some error, related to mapbox if we go to other page
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// displayMap(locations);

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();     //this prevents the form from loading any other page
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  })
}
// document.querySelector('.form').addEventListener('submit', e => {
//   e.preventDefault();     //this prevents the form from loading any other page
//   // const email = document.getElementById('email').value;   //value property is used to read that value out there
//   // const password = document.getElementById('password').value;
//   login(email, password);
// })

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    //and onto that form, we need to keep appending the data
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');

    updateSettings(form, 'data');
  })

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');  //since updateSettings is asynchronous function

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', e => {
    //change the text of the button to 'processing'
    e.target.textContent = 'Processing...'
    //e.target is basically the element which was clicked, so the one that triggered this event listener to be fired
    // const tourId = e.target.dataset.tourId;
    const { tourId } = e.target.dataset;   //destructuring method
    bookTour(tourId);
  })

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);