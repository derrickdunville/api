'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
let mongoosePaginate = require('mongoose-paginate');

var postSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true},
  created_at: { type: Date, default: Date.now() },
  end_date: { type: Date, default: null }
})

postSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Post', postSchema);
