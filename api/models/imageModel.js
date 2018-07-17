'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var imageSchema = new Schema({
  bucket: { type: String, required: true },
  key: { type: String, required: true},
  etag: { type: String, default: null },
  image_ext: {
    type: String,
    enum: ['.jpeg', '.png', '.gif'],
    required: true
  },
})

module.exports = mongoose.model('Image', imageSchema)
