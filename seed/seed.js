var seeder = require('mongoose-seed')
var users = require('./users')

let mongo = process.env.MONGODB_URI || 'mongodb://localhost/api'
// Connect to MongoDB via Mongoose
seeder.connect(mongo, async function() {

  let data = await populateData()
  // Load Mongoose models
  seeder.loadModels([
    '../api/models/userModel.js',
  ])

  // Clear specified collections
  seeder.clearModels(['User'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect()
    })
  })
})

async function populateData(){
  var data = []
  data.push(await users.seedUsers())
  return data
}
