let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User')
    Commission = mongoose.model('Commission')
    Transaction = mongoose.model('Transaction')
// Authorization Handler
// look up the user with the jwt token and push the users role list
// onto the request for authorization at the endpoint
exports.createCommission = function(transaction) {
    console.log('creating commission...');
    console.dir(transaction)
    console.log("username: "+ transaction.user.username)
}
