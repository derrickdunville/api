var seeder = require('mongoose-seed')
var products = require('./products')
var users = require('./users')
var transactions = require('./transactions')

let mongo = process.env.MONGODB_URI || 'mongodb://localhost/ascend_trading'
// Connect to MongoDB via Mongoose
seeder.connect(mongo, async function() {

  let data = await populateData()
  // Load Mongoose models
  seeder.loadModels([
    '../api/models/userModel.js',
    '../api/models/productModel.js',
    '../api/models/subscriptionModel.js',
    '../api/models/transactionModel.js',
    '../api/models/clickModel.js',
    '../api/models/commissionModel.js'
  ])

  // Clear specified collections
  seeder.clearModels(['User', 'Product', 'Transaction', 'Subscription', 'Click', 'Commission'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect()
    })
  })
})

async function populateData(){
  var data = []
  data.push(await users.seedUsers())
  // transactionSeeds = transactions.seedTransactions(userSeeds, [])
  data.push(await products.seedProducts())

  return data
}

// data.push(transactionSeeds)
