'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate');

var productSchema = new Schema({

  // About Details
  name: { type: String, unique: true, required: true},
  description: { type: String, default: null },
  category: {
    type: String,
    enum: ['membership', 'class', 'script', 'scanner'],
    required: true
  },

  // Billing Details
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd', required: true },
  interval: {
      type: String,
      enum: ['one-time', 'day', 'week', 'month', 'year', 'custom'],
      default: 'one-time',
      required: true
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
  discord_role_id: { type: String },
  created_at: { type: Date, default: Date.now },
  end_date: { type: Date },

  // File details
  cover_image: { type: Schema.Types.ObjectId, ref: 'Image', default: null },
  file: { type: Schema.Types.ObjectId, ref: 'S3File', default: null },
  
  video_id: {type: String}
})

productSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Product', productSchema)
