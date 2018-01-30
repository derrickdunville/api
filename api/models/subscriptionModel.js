'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var subscriptionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: Number, required: true },
  price: { type: Number, required: true }
})

module.exports = mongoose.model('Subscription', subscriptionSchema)
