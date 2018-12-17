'use strict';
let mongoose = require('mongoose');
//const beautifyUnique = require('mongoose-beautiful-unique-validation');
var uniqueValidator = require('mongoose-unique-validator');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');
let mongoosePaginate = require('mongoose-paginate');
let email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function toLower(v) {
  return v.toLowerCase();
}

function validateEmail(email){
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};
let userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    required: true,
    set: toLower,
    validate: {
      validator: validateEmail,
      message: "not a valid email",
      kind: "invalid"
    }
  },
  created_at: { type: Date, default: Date.now },
  token: { type: String, default: null },
  token_expires: { type: Date, default: null },
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

userSchema.plugin(mongoosePaginate);
userSchema.plugin(uniqueValidator, { message: 'already exists' });

module.exports = mongoose.model('User', userSchema);
