'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate')

var transactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  coupon_id: { type: Number, default: null },
  trans_num: {
    type: String,
    validate: {
      validator: function(v){
        return v !== null || v != undefined;
      },
      message: '{trans_num} cannot be null or undefined'
    },
    index: {
      sparse:true,
      unique: true,
    }
  },
  amount: { type: Number, required: true },
  amount_refunded: { type: Number, default: 0, required: true },
  total: { type: Number, default: 0.00 },
  tax_amount: { type: Number, default: 0.00 },
  tax_rate: { type: Number, default: 0.000 },
  tax_desc: { type: String, default: null },
  tax_compound: { type: Boolean, default: false },
  tax_shipping: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['succeeded', 'pending', 'failed', 'refunded'],
    default: 'pending'
  },
  txn_type: { type: String, default: null },
  response: { type: String, default: null },
  gateway: { type: String, default: "manual" },
  ip_address: { type: String, default: null },
  prorated: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now() },
  expires_at: { type: Date, default: null },
  refunded_at: { type: Date, default: null },
  end_date: { type: Date, default: null },
})
transactionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Transaction', transactionSchema)
