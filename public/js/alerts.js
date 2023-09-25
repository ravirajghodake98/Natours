//funtion to hide alerts
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
}

//type is 'success' or 'error'
export const showAlert = (type, msg, time = 7) => {
  //whenever we want to show alert, first hide all the alerts that already exist
  hideAlert();

  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  //afterbegin means inside of the body but right at the beginning
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  //to hide alert after 5 seconds
  // window.setTimeout(hideAlert, 5000);
  window.setTimeout(hideAlert, time * 1000);
};