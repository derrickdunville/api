'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    Click     = mongoose.model('Click'),
    ip        = require('ip')

exports.createClick = function(req, res) {
    console.log("Creating click...")
    console.log("Request Body: " + JSON.stringify(req.body))

    if(!req.body.username || !req.body.clicked_url) {
      res.status(400).send({err: "Must provide username and clicked_url"});
    } else {
      User.findOne({username: req.body.username})
      .exec(function(err, referred_by) {
          if (err){
              res.status(500).send();
          }
          if(referred_by != null || referred_by != undefined){
            console.log("referred_by: " + referred_by.username)
            let newClick = new Click({
              referred_by: referred_by._id,
              ip_address: req.ip,
              clicked_url: req.body.clicked_url,
              referring_url: (req.body.referring_url != undefined ? req.body.referring_url : null),
              created_at: new Date()
            })
            newClick.save(function(err, click) {
              if(err){
                res.status(500).send();
              } else {
                res.status(201).send();
              }
            })
          } else {
            res.status(400).send({err: "The provided referred_by username does not exist"});
          }
        });
      }
};

exports.listClicks = function(req, res) {

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
      console.log(req.query.sort)
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
    console.log("Query: " + JSON.stringify(query))
    console.log("Sort: " + JSON.stringify(sort))
    console.log("Limit: " + req.query.limit)
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
    options.populate = {path:'referred_by', select: 'username'}
    console.log("Options: " + JSON.stringify(options))
    // let permission = ac.can(req.user.roles).readAny('user');
    // if(permission.granted){

    // } else {
    //     res.status(400).send({err: "You are not authorized to view all users"});
    // }

    Click.paginate(query, options, function(err, clicks) {
      if(err){
        console.log(JSON.stringify(err))
        res.status(401).send({err:'Error getting clicks'})
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
        // console.dir("users: " + JSON.stringify(users))
        res.status(201).send(clicks);
      }
    });
};
