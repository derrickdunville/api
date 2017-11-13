'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');

var membershipSchema = new Schema({
    name: {
        type: String,
        unique: true,
        Required: 'Must name the membership'
    },
    price: {
        type: Double,
        Required: 'Must provide price'
    },
    description: {
        type: String
    },
    billing_type: {
        type: [{
            type: String,
            enum: ['one-time', 'recurring']
        }],
        default: ['one-time']
    },
    access: {
        type: [{
            type: String,
            enum: ['lifetime', 'expire', 'fixed expire']
        }],
        default: ['lifetime']
    },
    expire_on: {
        type: Date
    },
    expire_after_interval_amount: {
        type: Number,
        default: 0
    },
    expire_after_interval_type: {
        type: [{
            type: String,
            enum: ['days', 'weeks', 'months', 'years']
        }],
        default: ['lifetime']
    },
    allow_renewals: {
        type: Boolean,
        default: false
    },
    billing_interval: {
        type: [{
            type: String,
            enum: ['one-time', 'daily', 'weekly', 'monthly', 'yearly', 'custom']
        }],
        default: ['one-time']
    },
    trial_period: {
        type: Boolean,
        default: false
    },
    trial_duration_days: {
        type: Number,
        default: 0
    },
    trial_amount: {
        type: Number,
        default: 0.00
    },
    allow_only_one_trial: {
        type: Boolean,
        default: false
    },
    limit_payment_cycles: {
        type: Boolean,
        default: false
    },
    max_number_of_payments: {
        type: Number,
        default: 0
    },
    access_after_last_cycle: {
        type: [{
            type: String,
            enum: ['expire access', 'lifetime access']
        }],
        default: ['expire access']
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Membership', membershipSchema);
