'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var subscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  coupon: { type: Number, default: null },
  subscription_id: { type: String },
  price: { type: Number, required: true, default: 0.00 },
  total: { type: Number, default: 0.00 },
  tax_amount: { type: Number, default: 0.00 },
  tax_desc: { type: String, default: null },
  tax_compound: { type: Boolean, default: false },
  tax_shipping: { type: Boolean, default: true },
  tax_class: { type: String, default: "standard" },
  gateway: { type: String, default: "manual" },
  response: { type: String, default: null },
  id_address: { type: String, default: null },
  period: { type: Number, default: 1 },
  period_type: { type: String, default: "month" },
  limit_cycles: { type: Boolean, default: false },
  limit_cycles_num: { type: Number, default: 1 },
  limit_cycles_action: { type: String, default: "lifetime" },
  prorated_trial: { type: Boolean, default: false },
  trial: { type: Boolean, default: false },
  trial_days: { type: Number, default: 1},
  trial_amount: { type: Number, default: 0.00},
  status: {
    type: String,
    enum: ['trialing', 'active', 'past-due', 'canceled'],
    default: 'active'
  },
  current_period_start: { type: Date, required: true, default: Date.now() },
  current_period_end: { type: Date, required: true, default: Date.now() },
  cancel_at_period_end: { type: Boolean, required: true, default: false },
  canceled_at: { type: Date },
  created_at: { type: Date, required: true, default: Date.now() },
  cc_last4: { type: String, default: "4242" },
  cc_exp_month: { type: String, default: "01"},
  cc_exp_year: { type: String, default: "1999"},
  end_date: { type: Date, default: null }
})

module.exports = mongoose.model('Subscription', subscriptionSchema)
