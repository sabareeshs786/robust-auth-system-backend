require('dotenv').config();
const nodemailer = require('nodemailer');
const { errorLogger } = require('../middleware/errorHandler');
const { successLog } = require('../middleware/logEvents');
const emailId = process.env.EMAIL_ID;
const password = process.env.PASSWORD;

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailId,
    pass: password
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    let mailOptions = {
      from: emailId,
      to: to,
      subject: subject,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    successLog('Email sent: ' + info.response);
    
    return true;

  } catch (err) {
    errorLogger(err);
    return false;
  }
  
};

module.exports = { sendEmail };