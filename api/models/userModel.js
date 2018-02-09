'use strict';
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');

let userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true},
  created_date: { type: Date, default: Date.now },
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
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Subscription' }]
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
