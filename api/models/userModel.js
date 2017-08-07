'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');

var userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        Required: 'Your desired username'
    },
    password: {
        type: String,
        Required: 'Must provide password'
    },
    email: {
        type: String,
        Required: 'Must provide email address'
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    roles: {
        type: [{
            type: String,
            enum: ['super', 'admin', 'member', 'everyone']
        }],
        default: ['everyone']
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
