'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')

var s3FileSchema = new Schema({
  bucket: { type: String, required: true },
  key: { type: String, required: true},
  etag: { type: String, default: null },
  file_ext: {
    type: String,
    enum: ['.txt'],
    required: true
  },
})

module.exports = mongoose.model('S3File', s3FileSchema)
