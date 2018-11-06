let nodemailer = require('nodemailer')
let client_host = 'localhost:8080'

let sendGridSmtpTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  auth:{
    user: "apikey",
    pass: "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"
  },
})

exports.sendForgotPasswordEmail = function(user, token) {
  var mailOptions = {
    to: user.email,
    from: "dev@ascendtrading.net",
    subject: "[Ascend Trading] Forgot Passowrd",
    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  }
  sendGridSmtpTransport.sendMail(mailOptions, function(err){
    if (err){
      console.log("ERROR - Mailer.sendForgotPasswordEmail: " + err);
    } else {
      console.log("SUCCESS - Mailer.sendForgotPasswordEmail - sent")
    }
  })
}
exports.sendPasswordResetSuccessEmail = function(user){

}
exports.sendNewUserWelcomeMail = function(user) {
  var mailOptions = {
    to: user.email,
    from: "dev@ascendtrading.net",
    subject: "[Ascend Trading] Welcome " + user.username + "!",
    text: 'Hello '+ user.username + ',\n\n' +
          'Welcome to Ascend Trading.\n\n'
  }
  sendGridSmtpTransport.sendMail(mailOptions, function(err){
    if (err){
      console.log("ERROR - Mailer.sendNewUserWelcomeMail: " + err);
    } else {
      console.log("SUCCESS - Mailer.sendNewUserWelcomeMail - sent")
      console.dir(mailOptions)
    }
  })
}
exports.sendNewReferralRegistrationMail = function(user, referred_by) {
  var mailOptions = {
    to: referred_by.email,
    from: "dev@ascendtrading.net",
    subject: "[Ascend Trading] New Referral For " + referred_by.username + "!",
    text: 'Dear '+ referred_by.username + ',\n\n' +
          'A new user has registered using your referral link for Ascend Trading.\n'+
          'You may find the registration details below:\n\n' +
          'Username: ' + user.username + '\n\n' +
          'More detail about your referral can be found at http://'+client_host+'/ascend/account/referrals'
  }
  sendGridSmtpTransport.sendMail(mailOptions, function(err){
    if (err){
      console.log("ERROR - Mailer.sendNewUserWelcomeMail: " + err);
    } else {
      console.log("SUCCESS - Mailer.sendNewUserWelcomeMail - sent")
      console.dir(mailOptions)
    }
  })
}
exports.sendNewTransactionMail = function(user, transaction){

}
exports.sendNewTransactionReferralMail = function(user, referred_by, transaction) {

}
