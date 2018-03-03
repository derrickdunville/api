'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    config    = require('../config'),
    _         = require('lodash'),
    jwt       = require('jsonwebtoken'),
    ejwt      = require('express-jwt'),
    User      = mongoose.model('User'),
    waterfall = require('async-waterfall'),
    crypto    = require('crypto'),
    nodemailer = require('nodemailer'),
    AccessControl = require('accesscontrol');

// var accessList = [
//   //create user is unprotected
//   //{role: "admin", resource: "user", action: "create:any", attributes: ["*"]},
//   {role: "admin", resource: "user", action: "read:any", attributes: ["*", ]},
//   {role: "admin", resource: "user", action: "delete:any", attributes: ["*"]},
//   {role: "admin", resource: "user", action: "update:any", attributes: ["*", "!_id", "!password", "!createDate"]},
//
//   // create user is unprotected
//   //{role: "everyone", resource: "user", action: "create:any", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "read:own", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "delete:own", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "update:own", attributes: ["*", "!_id", "!createDate"]}
// ];

let grants = {
    admin: {
        user: {
            "read:any": ["*"],
            "delete:any": ["*"],
            "update:any": ["*",
              '!token',
              '!passwordResetToken',
              '!passwordResetExpires',
              '!discordOAuthToken',
              '!discordOAuthExpires',
              '!discordAccessToken',
              '!discordAccessTokenExpires',
              '!discordRefreshToken',
              '!discordUsername',
              '!discordDiscriminator',
              '!discordId',
              '!stripe_cus_id',
              '!transactions',
              '!subscriptions'
            ]
        }
    },
    everyone: {
        user: {
            "read:any": ['*', '!password', '!token', '!email'],
            "delete:own": ['*'],
            "update:own": ['*',
              '!created_date',
              '!token',
              '!passwordResetToken',
              '!passwordResetExpires',
              '!discordOAuthToken',
              '!discordOAuthExpires',
              '!discordAccessToken',
              '!discordAccessTokenExpires',
              '!discordRefreshToken',
              '!discordUsername',
              '!discordDiscriminator',
              '!discordId',
              '!roles',
              '!stripe_cus_id',
              '!transactions',
              '!subscriptions'
            ]
        }
    }
};

let ac = new AccessControl(grants);

exports.forgotPassword = function(req, res){
  // console.log("Forgot Password...");
  waterfall([
    function(done){
      crypto.randomBytes(20, function(err, buf) {
        let token = buf.toString('hex');
        done(err, token)
      });
    },
    function(token, done){
      if(!req.body.email) {
        res.status(400).send({err: "You must provide an email address"});
      } else {
        // console.log("Looking up user...");
        User.findOne({email: req.body.email}, function(err, user) {
          if (err){
            // console.log("Error: " + err);
            res.status(401).send(err);
          } else if (user === null) {
            // console.log("No user found with email " + req.body.email);
            res.status(401).send({'err' :"No user found with email " + req.body.email});
          } else {
            // console.log("Setting password reset token...");
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000 // 1 hour
            user.save(function(err){
              done(err, token, user);
            });
          }
        });
      }
    },
    function(token, user, done){
      // Send Email to user
      var transport = nodemailer.createTransport({
        host: "gator4234.hostgator.com",
        port: 465,
        secure: true,
        auth: {
          user: "dev@ascendtrading.net",
          pass: "4sc3ndD3v"
        }
      });
      var mailOptions = {
        to: user.email,
        from: "dev@ascendtrading.net",
        subject: "[Ascend Trading] Forgot Passowrd",
        text: 'Hi ' + user.username + ',\n\n' +
              'You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://localhost:3000/reset-password/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transport.sendMail(mailOptions, function(err){
        if (err){
          // console.log("err: " + err);
        }
        // console.log("Sending password reset email...");
        res.status(201).send({'msg': "Password reset email sent to " + user.email});
      });
    }
  ],
  function(err){
    if (err) {
      res.status(401).send(err);
    }
  });
};
exports.resetPassword = function(req, res) {
  waterfall([
    function(done){
      if(!req.body.resetToken || !req.body.newPassword){
        res.status(400).send({"err": "You must provide reset token and new password"});
      } else {
        // console.log("Looking up user...");
        User.findOne({passwordResetToken: req.body.resetToken}, function(err, user) {
          if (err){
            // console.log("Error: " + err);
            res.status(401).send(err);
          } else if (user === null) {
            // console.log("Reset token is invalid");
            res.status(401).send({"err" :"Password reset token is invalid"});
          } else {
            if(user.passwordResetExpires.getTime() < Date.now()){
              // console.log("Reset token is expired");
              res.status(401).send({"err" :"Password reset token is expired"});
            } else {
              // console.log("Setting new passowrd");
              user.passwordResetToken = null;
              user.passwordResetExpires = null;
              user.password = req.body.newPassword;
              user.save(function(err){
                done(err, user);
              });
            }
          }
        });
      }
    },
    function(user, done){
      // Send Email to user
      var transport = nodemailer.createTransport({
        host: "gator4234.hostgator.com",
        port: 465,
        secure: true,
        auth: {
          user: "dev@ascendtrading.net",
          pass: "4sc3ndD3v"
        }
      });
      var mailOptions = {
        to: user.email,
        from: "dev@ascendtrading.net",
        subject: "[Ascend Trading] Passowrd successfully reset",
        text: "Hi " + user.username + ",\n\n" +
              "Your password was successfully changed.\n\n" +
              "If you did not perform this password reset, your account may be compromised. " +
              "Please contact Ascend Trading at contact@ascendtrading.net immediatly."

      };
      transport.sendMail(mailOptions, function(err){
        if (err){
          // console.log("err: " + err);
        }
        // console.log("Sending password reset email...");
        res.status(201).send({"msg": "Password successfully reset email sent to " + user.email});
      });
    }
  ],
  function(err){
    if (err) {
      res.status(401).send(err);
    }
  });
};
exports.verifyPasswordResetToken = function(req, res){
  console.log("reset Token " + JSON.stringify(req.body));
  if(!req.body.hasOwnProperty("resetToken") || req.body.resetToken === null){
    res.status(401).send({"err": "Must provice reset token"});
  } else {
    User.findOne({passwordResetToken: req.body.resetToken}, function(err, user) {
      if(err || user === null){
        res.status(401).send({"err": "Invalid reset token"});
      } else {
        if(user.passwordResetExpires.getTime() < Date.now()){
          res.status(401).send({"err": "Exipred reset token"});
        } else {
          res.status(201).send({"msg": "Valid reset token"});
        }
      }
    });
  }
};

exports.loginUser = function(req, res){
    // console.log('Logging in...');
    // console.log(req.body);
    if (req.body.token !== undefined) {
      console.log('Logging in with token');
      User.findOne({token: req.body.token})
      .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
      .populate({path: 'transactions', populate: {path: 'product'}})
      .exec(function(err, user) {
          if (err || user === null){
            // console.log('Login failed...');
            res.status(401).send({"err": "username and password does not match"});
          } else {
            res.status(201).send(user)
          }
        })
    } else {
      console.log('Logging in with creds');
      if (!req.body.username || !req.body.password) {
          // console.log("You must provide the username and password");
          res.status(400).send({"err": "You must provide the username and password"});
      } else {
          //lookup user by username
          //password should come hashed from the client application
          // console.log("Looking up user...");
          User.findOne({username: req.body.username})
          .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
          .populate({path: 'transactions', populate: {path: 'product'}})
          .exec(function(err, user) {
              if (err || user === null){
                  // console.log('Login failed...');
                  res.status(401).send({"err": "username and password does not match"});
              } else {
                  // console.log(user);
                  if(user.password !== req.body.password){
                      // console.log('Login failed..');
                      res.status(400).send({"err": "username and password does not match"});
                  } else {
                      // save the user on to the session
                      //req.session.user = user;
                      user.token = '';
                      user.save(function(err, empty_token_user){
                          // create the jwt and save it to the user
                          // user.token = jwt.sign(user, process.end.JWT_SECRET)
                          empty_token_user.token = jwt.sign(empty_token_user, 'ascendtradingapi');
                          empty_token_user.save(function(err,updated_user){
                              // console.log('Logged in...');
                              res.status(201).send(updated_user);
                          })
                      });
                  }
              }
          });
      }
    }
};

exports.listUsers = function(req, res) {
    // console.log("User Roles: " + req.user.roles);
    // let permission = ac.can(req.user.roles).readAny('user');
    // if(permission.granted){
        User.find({}, function(err, users) {
            if (err)
                res.status(401).send(err);
            // filter the result set
            // let filteredUsers = permission.filter(JSON.parse(JSON.stringify(users)));
            // console.log('Filtered User List: ' + filteredUsers);
            res.status(201).send(users);
        });
    // } else {
    //     res.status(400).send({err: "You are not authorized to view all users"});
    // }
};

exports.createUser = function(req, res) {
    // console.log("Creating user...");
    // console.log("Request Body: " + req.body);
    if(!req.body.username || !req.body.password || !req.body.email) {
        res.status(400).send({err: "Must provide username, password, and email"});
    } else {
        let newUser = new User({username: req.body.username, password: req.body.password, email: req.body.email});
        newUser.save(function (err, user) {
            if (err) {
                // console.log("Error creating user!");
                res.status(401).send(err);
            } else {
                // console.log("User created");
                // Send them a welcome email here
                res.status(201).json(user);
            }
        });
    }
};

exports.readUser = function(req, res) {
    // Check the params
    if(!req.params.userId){
        res.status(400).send({err: "You must provide a userId"});
    }
    // Check the permission on the resource
    // let permission = ac.can('everyone').readAny('user');
    // if(permission.granted){
        User.findById(req.params.userId, function(err, user) {
            if (err)
                res.status(401).send(err);
            res.status(201).json(user);
        });
    // } else {
    //     res.status(401).send({err: "Unauthorized"});
    // }
};

exports.updateUser = function(req, res) {

  // console.log("Updating User: " + req.params.userId)
  console.log("username: " + JSON.stringify(req.body.username))

  // First check if the current users roles can update "ANY" user
  let updatePermission = ac.can(req.user.roles).updateAny('user')
  let readPermission = ac.can(req.user.roles).readAny('user')
  // If not granted, check if the current role can update "OWN" user
  if(updatePermission.granted === false){
    // Determine if the target user is "owned" by the current user.
    if(req.user._id === req.params.userId){         // updating own
      updatePermission = ac.can(req.user.roles).updateOwn('user')
      readPermission = ac.can(req.user.roles).readOwn('user')
    }
  }
  if(updatePermission.granted){
    // Updating own - must provide correct password
    // console.log("req.user._id: " + req.user._id)
    // console.log("req.params.userId: " + req.params.userId)
    // console.log(req.user._id == req.params.userId)
    if(req.user._id == req.params.userId){
      console.log("Updaing Own User")
      if(req.body.password === undefined){
        res.status(401).send({err: "Must provide password"})
      } else {
        if(req.user.password == req.body.password){
          if(req.body.newPassword !== undefined){
            req.body.password = req.body.newPassword
            console.log("Updaing password")
          } else {
            delete req.body.password
          }
          let filteredUpdates = updatePermission.filter(req.body)
          // console.log("Filtered User: " + JSON.stringify(filteredUpdates))
          User.findOneAndUpdate({_id: req.params.userId}, filteredUpdates, {new: true}, function(err, user) {
            if (err)
                res.status(401).send(err)
            // console.log("Updated User: " + JSON.stringify(user))
            let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
            // console.log("Filtered User: " + JSON.stringify(filteredUser))
            req.app.io.sockets.emit('user-updated', filteredUser)
            res.status(201).send({msg: "Successfully updated user", user: filteredUser});
          });
        } else {
          res.status(401).send({err: "Invalid password"})
        }
      }
    // Updating any - can skip password
    } else {
      console.log("Updating Any User")
      let filteredUpdates = updatePermission.filter(req.body)
      // console.log("Filtered User: " + JSON.stringify(filteredUpdates))
      User.findOneAndUpdate({_id: req.params.userId}, filteredUpdates, {new: true}, function(err, user) {
        if (err)
            res.status(401).send({err: err})
        // console.log("Updated User: " + JSON.stringify(user))
        let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
        // console.log("Filtered User: " + JSON.stringify(filteredUser))
        req.app.io.sockets.emit('user-updated', filteredUser)
        res.status(201).send({msg: "Successfully updated user", user: filteredUser});
      });
    }
  } else {
      res.status(400).send({err: "You are not authorized to update users"})
  }
};

exports.deleteUser = function(req, res) {
};
