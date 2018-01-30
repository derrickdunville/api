'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var couponSchema = new Schema({
  _id: Schema.Types.ObjectId,
  code: {
      type: String,
      unique: true,
      required: true
  },
  price: {
      type: Number,
      required: true
  },
  description: {
      type: String
  }
})

module.exports = mongoose.model('Coupon', couponSchema)
