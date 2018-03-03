var seeder = require('mongoose-seed')

let mongo = process.env.MONGODB_URI || 'localhost:27017/ascend_trading'
// Connect to MongoDB via Mongoose
seeder.connect(mongo, function() {

  // Load Mongoose models
  seeder.loadModels([
    '../api/models/userModel.js',
    '../api/models/productModel.js',
    '../api/models/subscriptionModel.js',
    '../api/models/transactionModel.js'
  ])

  // Clear specified collections
  seeder.clearModels(['User', 'Product', 'Transaction', 'Subscription'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect()
    })
  })
})

// Data array containing seed data - documents organized by Model
var data = [
  {
    'model': 'User',
    'documents': [
      {
        '_id': '5a6a572368cb6852a68a83d4',
        'username': 'derrick',
        'password': 'derrick',
        'email': 'derrick@ascendtrading.net',
        'roles': ['admin']
      },
      {
        '_id': '5a6a572368cb6852a68a83d5',
        'username': 'frank',
        'password': 'frank',
        'email': 'frank@ascendtrading.net',
        'roles': ['everyone']
      }
    ]
  },
  {
    'model': 'Product',
    'documents': [
    {
      "_id": "5a8eac0f5b4e7158a8559d71",
      "stripe_plan_id": "plan_diamond_monthly",
      "name": "Diamond",
      "amount": 99.99,
      "description": "Diamond (Monthly)",
      "__v": 0,
      "create_date": "2018-02-22T11:39:59.000Z",
      "expire_after_interval_amount": 0,
      "access_after_last_cycle": "expire access",
      "max_number_of_payments": 0,
      "limit_payment_cycles": false,
      "allow_only_one_trial": false,
      "trial_amount": 0,
      "trial_duration_days": 0,
      "trial_period": false,
      "allow_renewals": false,
      "access": "expire",
      "interval": "month",
      "currency": "usd"
    }
    ]
  }
]
