'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate');

var productSchema = new Schema({
  currency: { type: String, default: 'usd', required: true },
  interval: {
      type: String,
      enum: ['one-time', 'day', 'week', 'month', 'year', 'custom'],
      default: 'one-time',
      required: true
  },
  name: { type: String, unique: true, required: true},
  amount: { type: Number, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['membership', 'class', 'script', 'scanner'],
    default: 'membership'
  },
  access: {
    type: String,
    enum: ['lifetime', 'expire', 'fixed-expire'],
    default: 'lifetime'
  },
  allow_renewals: { type: Boolean, default: false },
  trial_period: { type: Boolean, default: false },
  trial_duration_days: { type: Number, default: 0},
  trial_amount: { type: Number, default: 0.00 },
  allow_only_one_trial: { type: Boolean, default: false },
  limit_payment_cycles: { type: Boolean, default: false },
  max_number_of_payments: { type: Number, default: 0 },
  access_after_last_cycle: {
      type: String,
      enum: ['expire access', 'lifetime access'],
      default: 'expire access'
  },
  expire_on: { type: Date },
  expire_after_interval_amount: { type: Number, default: 0 },
  expire_after_interval_type: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
  },
  stripe_plan_id: { type: String },
  create_date: { type: Date, default: Date.now },
  end_date: { type: Date }
})

productSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Product', productSchema)
