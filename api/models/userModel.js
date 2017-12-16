'use strict';
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');

let userSchema = new Schema({
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
        unique: true,
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
    },
    token: {
        type: String,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
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
