let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User')

// Authorization Handler
// look up the user with the jwt token and push the users role list
// onto the request for authorization at the endpoint
exports.ensureAuthorized = function(req, res, next) {
    console.log('ensureAuthorized...');
    let bearerToken;
    let cookie = req.headers["cookie"];
    if (typeof req.cookies.cookie !== 'undefined' && req.cookies.cookie !== null) {
      console.log("cookie is not undefined")
        // console.log("cookies")
        console.dir(req.cookies);
        // let bearer = bearerHeader.split(" ");
        // bearerToken = bearer[1];
        // console.log("Sent Token: " + bearerToken);
        // use the token to look up the user
        let current_date = Date.now()
        User.findOne({token: req.cookies.cookie}, function(err, user) {
        // User.findOne({token: req.cookies.cookie, token_expires: {$gt: current_date}}, function(err, user) {
            if (err || user === null){
                // console.log('Token lookup failed...');
                res.status(401).send({err: "Invalid Token - Error: " + err});
            } else {
                // User was found with the token
                // console.log(user);
                req.user = user;
                // console.log('Valid Token - Authorized');
                next();
            }
        });
    } else {
        res.status(403).send({err: {message:"Authorization not provided"}});
    }
}

// check for an authorization to lookup the user
// however this authorization handler doesn't require an auth token.
// usefull for public endpoints while maintaining access control to resource properties
exports.optionalAuthorization = function(req, res, next) {
    // console.log('ensureAuthorized...');
    let bearerToken;
    let bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
      let bearer = bearerHeader.split(" ");
      bearerToken = bearer[1];
      // console.log("Sent Token: " + bearerToken);
      // use the token to look up the user
      User.findOne({token: bearerToken}, function(err, user) {
        if (err || user === null){
          // console.log('Token lookup failed...');
          req.user = {roles: ['public']};
          next();
        } else {
          // User was found with the token
          // console.log(user);
          req.user = user;
          // console.log('Valid Token - Authorized');
          next();
        }
      });
    } else {
      // add public roles to user
      req.user = {roles: ['public']};
      next();
    }
}
