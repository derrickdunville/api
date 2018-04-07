var seeder = require('mongoose-seed')
var products = require('./products')
var users = require('./users')
var transactions = require('./transactions')

let mongo = process.env.MONGODB_URI || 'mongodb://localhost/ascend_trading'
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


var data = []
userSeeds = users.seedUsers()
productSeeds = products.seedProducts()
// transactionSeeds = transactions.seedTransactions(userSeeds, [])

data.push(userSeeds)
data.push(productSeeds)
// data.push(transactionSeeds)
