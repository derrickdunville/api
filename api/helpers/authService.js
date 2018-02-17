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
    let bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        console.log("Sent Token: " + bearerToken);
        // use the token to look up the user
        User.findOne({token: bearerToken}, function(err, user) {
            if (err || user === null){
                console.log('Token lookup failed...');
                res.status(401).send({err: "Invalid Token - Error: " + err});
            } else {
                // User was found with the token
                // console.log(user);
                req.user = user;
                console.log('Valid Token - Authorized');
                next();
            }
        });
    } else {
        res.status(403).send({err: "Provide Token"});
    }
}
