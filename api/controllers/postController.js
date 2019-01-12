'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    Post      = mongoose.model('Post'),
    mongoosePaginate = require('mongoose-paginate');

exports.createPost = function(req, res){
  let newPost = new Post(req.body)
  newPost.save(function(err, post) {
    if(err){
      // console.dir(err)
      res.status(401).send(err)
    } else {
      Post.findById({_id: post._id})
      .populate({path: 'user'})
      .then(populated_post => {
        res.status(201).json(populated_post)
      }).catch(err => {
        res.status(500).send({err: err})
      })
    }
  })
}
exports.readPost = function(req, res){
  Post.findById(req.params.id)
  .populate({path: 'user'})
  .then(populated_post => {
    res.status(201).send(populated_post)
  }).catch(err => {
    // console.dir(err)
    res.status(401).send(err)
  })
}
exports.listPosts = function(req, res) {
  let query = {}

  if(req.query.userId !== undefined){
    query.userId = {'$regex': req.query.userId, '$options': 'i'}
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

  Post.paginate(query, options, function(err, posts) {
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
      res.status(201).send(posts);
    }
  });
};
exports.updatePost = function(req, res){
  Post.findOneAndUpdate(req.params.postId, req.body, { new: true }, function(err, post){
    if(err){
      res.status(401).send(err)
    } else {
      res.status(201).send(post)
    }
  })
}
exports.deletePost = function(req, res){
  Post.findOneAndUpdate(req.params.postId, { end_date: new Date()}, { new: true }, function(err, post){
    if(err)
      res.status(401).send(err)
    res.status(200).send({ message: 'post successfully deleted'})
  })
}
