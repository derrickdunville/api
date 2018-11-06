'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    User      = mongoose.model('User')

exports.validateUsername = function(req, res) {
  User.findOne({username: req.params.username})
  .exec(function(err, user) {
    if(err){
        res.status(500).send(err);
    } else {
      if(user == null){
        res.status(200).json({ valid: false });
      } else {
        res.status(200).json({ valid: true });
      }
    }
  });
};
