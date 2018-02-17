var seeder = require('mongoose-seed')

let mongo = process.env.MONGODB_URI || 'localhost:27017/ascend_trading'
// Connect to MongoDB via Mongoose
seeder.connect(mongo, function() {

  // Load Mongoose models
  seeder.loadModels([
    '../api/models/userModel.js',
    '../api/models/productModel.js'
  ])

  // Clear specified collections
  seeder.clearModels(['User', 'Product'], function() {

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
  // {
  //   'model': 'Product',
  //   'documents': [
  //     {
  //       '_id': '5a6b9d88ac9e591424063482',
  //       'name': 'Diamond',
  //       'amount': '99.99',
  //       'description' : 'Diamond Membership has access to...'
  //     }
  //   ]
  // }
]
