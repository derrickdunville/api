'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    User      = mongoose.model('User')

exports.validateUsername = function(req, res) {
    // Check the params
    if(!req.params.username){
        res.status(400).send({err: "You must provide a username"});
    }
    User.findOne({username: req.params.username})
    .exec(function(err, user) {
      if (err)
          res.status(401).send(err);
      if(user == null){
        res.status(200).json({ valid: false });
      } else {
        res.status(200).json({ valid: true });
      }
    });
};
