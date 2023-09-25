const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  //constructor is a function which is basically be running, when a new object is created through this class
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Raviraj Ghodake <${process.env.EMAIL_FROM}>`;
  }

  //create a method in order to create a transport
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //SendGrid
      return nodemailer.createTransport({
        // service: 'Brevo',
        host: process.env.SENDINBLUE_HOST,
        port: process.env.SENDINBLUE_PORT,
        auth: {
          user: process.env.SENDINBLUE_LOGIN,
          pass: process.env.SENDINBLUE_SMTPKEY,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  //send the actual email
  async send(template, subject) {
    //1) Render the HTML for the email based on a pug template
    //__dirname is the location of the currently running script
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    //2)Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    }

    //3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    //this template('welcome') here will be the pug template
    await this.send('welcome', 'Welcome to the Natours Family!')
  }

  async sendPasswordReset(){
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
  }
}


// const sendEmail = async options => {
  // //1) Create a transporter- is a service that will actually send the email
  // const transporter = nodemailer.createTransport({
  //   // service: 'Gmail',
  //   host: process.env.EMAIL_HOST,
  //   port: process.env.EMAIL_PORT,
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD
  //   }
  //   //activate in 'gmail less secure' app option if you want to go with gmail service
  // })

//   //2) Define the email options
//   const mailOptions = {
//     from: 'Raviraj Ghodake <raviraj@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   }

//   //3) Actually send the email
//   await transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail;