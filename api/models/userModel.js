'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
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

module.exports = mongoose.model('Users', UserSchema);
