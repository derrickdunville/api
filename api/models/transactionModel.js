'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var transactionSchema = new Schema({
  amount: { type: Number, required: true },
  total: { type: Number, default: 0.00 },
  tax_amount: { type: Number, default: 0.00 },
  tax_rate: { type: Number, default: 0.000 },
  tax_desc: { type: String, default: null },
  tax_compound: { type: Boolean, default: false },
  tax_shipping: { type: Boolean, default: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: Number, required: true },
  coupon_id: { type: Number, default: null },
  trans_num: { type: String, default: null },
  status: { type: String, default: null },
  txn_type: { type: String, default: null },
  response: { type: String, default: null },
  gateway: { type: String, default: "manual" },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  id_address: { type: String, default: null },
  prorated: { type: Boolean, default: false },
  created_at: { type: Date, required: true },
  expires_at: { type: Date, required: true },
  end_date: { type: Date, default: null }
})

module.exports = mongoose.model('Transaction', transactionSchema)
