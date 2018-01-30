'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var transactionSchema = new Schema({
  amount: { type: Number, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: Number, required: true },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'Subscription' }
})

module.exports = mongoose.model('Transaction', transactionSchema)
