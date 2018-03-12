let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Event    = mongoose.model('Event'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol');

//
// let grants = {
//     admin: {
//         event: {
//             "read:any": ["*"],
//             "delete:any": ["*"],
//             "update:any": ["*"]
//         }
//     },
//     everyone: {
//         event: {
//             "read:any": ['*', '!password', '!token', '!email'],
//             "delete:own": ['*'],
//             "update:own": ['*']
//         }
//     }
// };

exports.listEvents = function(req, res) {
  // console.log("User Roles: " + req.user.roles);
  // let permission = ac.can(req.user.roles).readAny('event');
  // if(permission.granted){
  Event.find({}, function(err, events) {
      if (err)
          res.status(401).send(err)
      // filter the result set
      // let filteredEvents = permission.filter(JSON.parse(JSON.stringify(events)));
      // console.log('Filtered User List: ' + filteredUsers);
      res.status(201).send(events)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to view all events"});
  // }
};

exports.readEvent = function(req, res) {
  // Check the params
  // if(!req.params.eventId){
  //     res.status(400).send({err: "You must provide a eventId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can('everyone').readAny('event');
  // if(permission.granted){
  Event.findById(req.params.eventId, function(err, event) {
      if (err)
          res.status(401).send(err)
          // Todo: Filter the memebership object
      res.status(201).json(event)
  });
  // } else {
  //     res.status(401).send({err: "Unauthorized"});
  // }
};
