let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    Event      = mongoose.model('Event')

// Authorization Handler
// look up the user with the jwt token and push the users role list
// onto the request for authorization at the endpoint
exports.createEvent = function() {
    // console.log('ensureAuthorized...');

}
