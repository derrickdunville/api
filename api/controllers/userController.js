'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    config    = require('../config'),
    path      = require('path'),
    _         = require('lodash'),
    jwt       = require('jsonwebtoken'),
    ejwt      = require('express-jwt'),
    User      = mongoose.model('User'),
    Image     = mongoose.model('Image'),
    waterfall = require('async-waterfall'),
    crypto    = require('crypto'),
    nodemailer = require('nodemailer'),
    AccessControl = require('accesscontrol'),
    mailers   = require('../mailers'),
    stripe    = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    AWS       = require('aws-sdk'),
    s3        = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});

let grants = {
    admin: {
      user: {
        "read:any": [
          '_id',
          'username',
          '!password',
          'email',
          'created_at',
          '!token',
          '!passwordResetToken',
          '!passwordResetExpires',
          '!discordOAuthToken',
          '!discordOAuthExpires',
          '!discordAccessToken',
          '!discordAccessTokenExpires',
          '!discordRefreshToken',
          'discordUsername',
          'discordDiscriminator',
          'discordId',
          'roles',
          'stripe_cus_id',
          'stripe_acct_id',
          'transactions',
          'subscriptions',
          'referred_by',
          'avatar'
        ],
        "read:own": [
          '_id',
          'username',
          '!password',
          'email',
          'created_at',
          'token',
          '!passwordResetToken',
          '!passwordResetExpires',
          '!discordOAuthToken',
          '!discordOAuthExpires',
          '!discordAccessToken',
          '!discordAccessTokenExpires',
          '!discordRefreshToken',
          'discordUsername',
          'discordDiscriminator',
          'discordId',
          'roles',
          'stripe_cus_id',
          'stripe_acct_id',
          'transactions',
          'subscriptions',
          '!referred_by',
          'avatar'
        ],
        "delete:any": ["*"],
        "update:any": ["*",
          '!_id',
          'username',
          'password',
          'email',
          '!created_at',
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
          'roles',
          '!stripe_cus_id',
          '!stripe_acct_id',
          '!transactions',
          '!subscriptions',
          'referred_by',
          'avatar'
        ]
      }
    },
    everyone: {
      user: {
        "read:any": [
          '_id',
          'username',
          '!password',
          '!email',
          'created_at',
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
          'roles',
          '!stripe_cus_id',
          '!stripe_acct_id',
          '!transactions',
          '!subscriptions',
          '!referred_by',
          'avatar'
        ],
        "read:own": [
          '_id',
          'username',
          '!password',
          'email',
          'created_at',
          'token',
          '!passwordResetToken',
          '!passwordResetExpires',
          '!discordOAuthToken',
          '!discordOAuthExpires',
          '!discordAccessToken',
          '!discordAccessTokenExpires',
          '!discordRefreshToken',
          'discordUsername',
          'discordDiscriminator',
          'discordId',
          'roles',
          'stripe_cus_id',
          'stripe_acct_id',
          'transactions',
          'subscriptions',
          '!referred_by',
          'avatar'
        ],
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
          '!stripe_acct_id',
          '!transactions',
          '!subscriptions',
          '!referred_by'
        ]
      }
    }
};
let ac = new AccessControl(grants);

exports.forgotPassword = function(req, res){
  waterfall([
    function(done){
      if(!req.body.email) {
        done({res_code: 400, err: {message: "You must provide an email"}})
      } else {
        // create a password recovery token
        crypto.randomBytes(20, function(err, buf) {
          let token = buf.toString('hex');
          done(err, token)
        });
      }
    },
    function(token, done){
      User.findOne({email: req.body.email})
      .then(user => {
        if(user == null){
          done({res_code: 400, err: {message: "email address not found"}})
        } else {
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000 // 1 hour
          user.save()
          .then(user => {
            done(null, token, user);
          }).catch(err => {
            done(err)
          });
        }
      }).catch(err => {
        done(err)
      })
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
          done(err)
        } else {
          res.status(201).send({message: "Password reset email sent to " + user.email});
        }
      });
    }
  ],
  function(err){
    if(err.hasOwnProperty('res_code')){
      res.status(err.res_code).send({err: err.err})
    } else {
      res.status(500).send({err: err})
    }
  })
};
exports.resetPassword = function(req, res) {
  waterfall([
    function(done){
      if(!req.body.resetToken || !req.body.newPassword){
        done({res_code: 400, err: {message: "you must provide password reset token and new password"}});
      } else {
        User.findOne({passwordResetToken: req.body.resetToken})
        .then(user => {
          if(user == null || (user.passwordResetExpires.getTime() < Date.now())){
            done({res_code: 400, err: {message: "invalid or expired password reset token"}})
          } else {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            user.password = req.body.newPassword;
            user.save()
            .then(updated_user => {
              done(null, updated_user)
            }).catch(err => {
              done(err)
            })
          }
        }).catch(err => {
          done(err)
        })
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
          done(err)
        } else {
          res.status(201).send({message: "password successfully reset, email sent to " + user.email});
        }
      });
    }
  ],
  function(err){
    if(err.hasOwnProperty('res_code')){
      res.status(err.res_code).send({err: err.err})
    } else {
      res.status(500).send({err: err})
    }
  })
};
exports.verifyPasswordResetToken = function(req, res){
  if(!req.body.hasOwnProperty("resetToken") || req.body.resetToken === null){
    res.status(400).send({err: {message: "must provide reset token"}});
  } else {
    User.findOne({passwordResetToken: req.body.resetToken}, function(err, user) {
      if(err || user == null){
        res.status(401).send({err: {message: "invalid reset token"}});
      } else {
        if(user.passwordResetExpires.getTime() < Date.now()){
          res.status(401).send({err: {message: "exipred reset token"}});
        } else {
          res.status(201).send({message: "valid reset token"});
        }
      }
    });
  }
};
exports.loginUser = function(req, res){
  if (req.body.token !== undefined) {
    User.findOne({token: req.body.token})
    .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
    .populate({path: 'transactions', populate: {path: 'product', populate: {path: 'cover_image'}}})
    .populate({path: 'avatar'})
    .then(user => {
      if(user == null){
        res.status(401).send({err: {message: "invalid or expired auth token"}});
      } else {
        let readPermission = ac.can(user.roles).readOwn('user')
        let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
        res.status(201).send(filteredUser);
      }
    }).catch(err => {
      res.status(500).send({err: err});
    })
  } else {
    if (!req.body.username || !req.body.password) {
      res.status(400).send({err: {message: "You must provide the username and password"}});
    } else {
      //lookup user by username
      //password should come hashed from the client application
      User.findOne({username: req.body.username})
      .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
      .populate({path: 'transactions', populate: {path: 'product', populate: {path: 'cover_image'}}})
      .populate({path: 'avatar'})
      .then(user => {
        if(user == null || (user.password !== req.body.password)){
          res.status(400).send({err: {message: "username and password does not match"}});
        } else {
          user.token = '';
          user.save()
          .then(empty_token_user => {
            // create new token for user
            empty_token_user.token = jwt.sign(empty_token_user, 'ascendtradingapi');
            return empty_token_user.save()
          })
          .then(updated_token_user => {
            // Create the readPermission so we can filter the retured user properties
            let readPermission = ac.can(updated_token_user.roles).readOwn('user')
            let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(updated_token_user)))
            res.status(201).send(filteredUser);
          }).catch(err => {
            res.status(500).send({err: err});
          })
        }
      }).catch(err => {
        res.status(500).send({err: err});
      })
    }
  }
};

exports.listUsers = function(req, res) {
    let query = {}

    if(req.query.username !== undefined){
      query.username = {'$regex': req.query.username, '$options': 'i'}
    }
    if(req.query.email !== undefined){
      query.email = {'$regex': req.query.email, '$options': 'i'}
    }
    if(req.query.discord !== undefined){
      query.discord = {'$regex': req.query.discord, '$options': 'i'}
    }
    if(req.query.role !== undefined){
      query.roles = {'$in': [req.query.role]}
    }

    // Handle parsing sort
    let sort = {}
    if(req.query.sort !== undefined){
      var sortList = req.query.sort.split(",")
      for(var i = 0; i < sortList.length; ++i){
        var direction = -1
        var sortTypeArray = sortList[i].split(":")
        var column = sortTypeArray[0]
        if(sortTypeArray.length > 1){
          if(sortTypeArray[1] === "asc"){
            direction = 1
          }
        }
        sort[column] = direction
      }

    }

    let options = {}
    /* Handle parsing current page */
    if (req.query.page === undefined) {
      options.page = 1
    } else {
      options.page = parseInt(req.query.page)
    }

    /* Handle parsing limit */
    if(req.query.limit === undefined){
      options.limit = 10
    } else {
      if(parseInt(req.query.limit) > 100){
        options.limit = 100
      } else {
        options.limit = parseInt(req.query.limit)
      }
    }

    if(sort != {}){
      options.sort = sort
    }
    options.lean = true

    let permission = ac.can(req.user.roles).readAny('user');
    if(permission.granted){
      User.paginate(query, options, function(err, users) {
        if(err){
          res.status(500).send(err)
        } else {
          /**
           * Response looks like:
           * {
           *   docs: [...] // array of Posts
           *   total: 42   // the total number of Posts
           *   limit: 10   // the number of Posts returned per page
           *   page: 2     // the current page of Posts returned
           *   pages: 5    // the total number of pages
           * }
          */
          let filteredUsers = permission.filter(JSON.parse(JSON.stringify(users.docs)))
          users.docs = filteredUsers
          res.status(201).send(users);
        }
      });
    } else {
      res.status(401).send({err: {message: "You are not authorized to view all users"}});
    }
};
exports.createUser = function(req, res) {
    // A user must provide
    // 1) username - unique
    // 2) password
    // 3) email - unique
    // User may have been referred by another user
    // Create a customer on stripe for the new user
    waterfall([
      function(done){
        // check for a username, password, and email in the req body
        if(!req.body.username || !req.body.password || !req.body.email) {
          done({res_code: 400, err: {message: "Must provide username, password, and email"}});
        } else {
          // check if referred_by came with the new user
          let referred_by
          if(req.body.referred_by == undefined){
            referred_by = null
            done(null, null, done)
          } else {
            User.findOne({username: req.body.referred_by})
            .exec(function(err, referred_by) {
              if (err){
                done(err)
              } else {
                done(null, referred_by)
              }
            });
          }
        }
      },
      function(referred_by, done){

        let newUser = new User({
          username: req.body.username,
          password: req.body.password,
          email: req.body.email,
          referred_by: referred_by
        });
        newUser.save().then(user => {
          user.token = jwt.sign(user, 'ascendtradingapi');
          stripe.customers.create({
            email: user.email
          }, function(err, customer){
            if(err){
              done(err)
            } else {
              user.stripe_cus_id = customer.id
              user.save().then(updated_user => {
                // Send the new user a welcome email here
                // mailers.sendNewUserWelcomeMail(updated_user)
                // // Send the referring user an emai
                // if(referred_by != null){
                //   mailers.sendNewReferralRegistrationMail(updated_user, referred_by)
                // }
                res.status(201).send(updated_user);
              }).catch(err => {
                done(err)
              })
            }
          })
        }).catch(err => {
          done(err)
        })
      }
    ],
    function(err){
      if(err.hasOwnProperty('res_code')){
        res.status(err.res_code).send({err: err.err})
      } else {
        res.status(500).send({err: err})
      }
    })
};
exports.readUser = function(req, res) {

    // Check the params
    if(!req.params.userId){
        res.status(400).send({err: "You must provide a userId"});
    }
    // Check if the user has permission to read user
    let readPermission = ac.can(req.user.roles).readAny('user')
    // Determine if the target user is "owned" by the current user.
    if(req.user._id == req.params.userId || req.user.username == req.params.userId){         // reading own
      readPermission = ac.can(req.user.roles).readOwn('user')
    }
    if(readPermission.granted){
      User.findOne({username: req.params.userId})
      .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
      .populate({path: 'transactions', populate: {path: 'product'}})
      .populate({path: 'avatar'})
      .exec()
      .then(user => {
        if(user == null){
          res.status(404).send({err: {message: "user not found"}})
        } else {
          let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
          res.status(201).json(filteredUser);
        }
      }).catch(err => {
        res.status(500).send(err);
      })
    } else {
      res.status(401).send({err: {message: "permission to read user denied"}});
    }
};
exports.updateUser = function(req, res) {

  let userUpdates = JSON.parse(req.body.user)

  // Validate Email Field if present
  if(userUpdates.email != undefined){
    if(userUpdates.email == req.user.email){
      delete userUpdates.email
    }
  }
  // First check if the current users roles can update "ANY" user
  let updatePermission = ac.can(req.user.roles).updateAny('user')
  let readPermission = ac.can(req.user.roles).readAny('user')
  // Check if the record is "OWN" user
  if(req.user._id == req.params.userId){
    updatePermission = ac.can(req.user.roles).updateOwn('user')
    readPermission = ac.can(req.user.roles).readOwn('user')
  }
  if(updatePermission.granted){
    waterfall([
      function(done){
        // If user is updating own they must supply password as well
        if(req.user._id == req.params.userId){
          if(userUpdates.password == undefined){
            done({res_code: 401, err: {err: {message: "Must provide password"}}})
          } else {
            // verify correct password
            if(req.user.password == userUpdates.password){
              // check if the user is requesting to update password
              if(userUpdates.newPassword !== undefined){
                 userUpdates.password = userUpdates.newPassword
               } else {
                 delete userUpdates.password
               }
              done(null, userUpdates)
            } else {
              done({res_code: 401, err: {err: {message: "Invalid password"}}})
            }
          }
        } else {
          // If user is not updating own and was already granted permission they must be an admin updating any
          done(null, userUpdates)
        }
      },
      function(user, done){
        // handle uploading new avatar if one was sent with update
        if(req.file != undefined){
          let newImage = new Image({
            bucket: "ascendtrading/avatars", // should be a config var
            key: req.user._id + "_" + req.file.originalname,
            image_ext: path.extname(req.file.originalname)
          })
          var objectParams = {Bucket: newImage.bucket, Key: newImage.key, Body: req.file.buffer, ACL: "public-read"}
          let upload = s3.putObject(objectParams).promise()
          upload.then(data => {
            newImage.etag = data.etag
            return newImage.save()
          }).then(image => {
            done(null, user, image)
          }).catch(err => {
            done(err)
          })
        } else {
          done(null, user, null)
        }
      },
      function(user, avatar, done){
        let filteredUpdates = updatePermission.filter(user)
        if(avatar != null){
          filteredUpdates.avatar = avatar
        }
        User.findOneAndUpdate({_id: req.params.userId}, filteredUpdates, {runValidators: true, context: 'query', new: true})
        .populate({path: 'subscriptions', populate: {path: 'product'}, match: { status: "active" }})
        .populate({path: 'transactions', populate: {path: 'product'}})
        .populate({path: 'avatar'})
        .then(user => {
          let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
          req.app.io.sockets.in('ADMIN').emit('USER_UPDATED', filteredUser)
          res.status(201).send(filteredUser);
        }).catch(err => {
          done(err)
        })
      }
    ],
    function(err){
      if(err.hasOwnProperty('res_code')){
        res.status(err.res_code).send(err.err)
      } else {
        res.status(500).send({err: err})
      }
    })
  } else {
      res.status(401).send({err: {message: "You are not authorized to update users"}})
  }
};
exports.deleteUser = function(req, res) {
  // we do not actually delete user records, we endate them and mask identifiable attributes

  let deletePermission = ac.can(req.user.roles).deleteAny('user')
  // Check if the record is "OWN" user
  if(req.user._id == req.params.userId){
    deletePermission = ac.can(req.user.roles).deleteOwn('user')
  }
  if(deletePermission.granted){
    User.findOneAndUpdate({_id: req.params.userId}, {end_date: new Date()}, {runValidators: true, context: 'query', new: true})
    .then(user => {
      if(user == null){
        res.status(404).send({err: {message: "user not found"}})
      } else {
        res.status(200).send();
      }
    }).catch(err => {
      console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to delete users"}})
  }
};
