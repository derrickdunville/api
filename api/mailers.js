let nodemailer = require('nodemailer');

exports.sendForgotPasswordEmail = function(user, token) {
  var smtpTransport = nodemailer.createTransport({
    host: 'gator4234.hostgator.com',
    port: 465,
    secure: true,
    auth:{
      user: "derrick@ascendtrading.net",
      pass: "Derrick0690"
    }
  });
  var mailOptions = {
    to: user.email,
    from: "no-reply@ascendtrading.net",
    subject: "[Ascend Trading] Forgot Passowrd",
    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  });
  smtpTransport.sendMail(mailOptions){

  });
}
