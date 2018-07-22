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
  console.log("validating email...("+email+")")
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
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  discordOAuthToken: { type: String, default: null },
  discordOAuthExpires: { type: Date, default: null },
  discordAccessToken: { type: String, default: null },
  discordAccessTokenExpires: { type: Date, default: null },
  discordRefreshToken: { type: String, default: null },
  discordUsername: { type: String, default: null },
  discordDiscriminator: { type: String, default: null },
  discordId: { type: String, default: null },
  roles: {
    type: [{
      type: String,
      enum: ['super', 'admin', 'member', 'everyone']
    }],
    default: ['everyone']
  },
  stripe_cus_id: { type: String, default: null },
  stripe_acct_id: { type: String, default: null },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Subscription' }],
  referred_by: { type: Schema.Types.ObjectId, ref: 'User'},
  avatar: {type: Schema.Types.ObjectId, ref: 'Image'}
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
