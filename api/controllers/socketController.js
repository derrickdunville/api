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

exports.testing = function(req, res) {
  console.log('testing')

  req.app.io.sockets.emit('test', 'hello')
  res.status(200).send({res: "response"});
};
