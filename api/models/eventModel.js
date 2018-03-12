'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var eventSchema = new Schema({
  type: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  object: { type: Schema.Types.ObjectId }
})

module.exports = mongoose.model('Event', eventSchema)
