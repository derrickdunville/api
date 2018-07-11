'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt   = require('bcrypt-nodejs')
let mongoosePaginate = require('mongoose-paginate');

var commissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true, default: 0 },
  corrected_total: { type: Number, required: true, default: 0},
  created_at: { type: Date, required: true, default: Date.now() }
})

commissionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Commission', commissionSchema)
