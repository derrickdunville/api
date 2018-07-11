'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate');

var clickSchema = new Schema({
  referred_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ip_address: { type: String, default: null },
  clicked_url: { type: String, required: true },
  referring_url: { type: String, default: null },
  created_at: { type: Date, required: true, default: Date.now() }
})

clickSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Click', clickSchema)
