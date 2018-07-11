'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate');

var payoutSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  commissions: [{ type: Schema.Types.ObjectId, ref: 'Commission', required: true }],
  total: { type: Number, required: true, default: 0 },
  created_at: { type: Date, required: true, default: Date.now() },
  automatic: { type: Boolean, default: true },
  destination: { type: String, default: null}
})

payoutSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Payout', payoutSchema)
