let faker = require('faker')
let utils = require('./utils')

exports.seedUsers= function(){

  let documents = []

  let model = "User"
  let derrick =
    {
      _id: '5a6a572368cb6852a68a83d4',
      username: 'derrick',
      password: 'derrick',
      email: 'derrick@ascendtrading.net',
      roles: ['admin']
    }
  documents.push(derrick)
  let frank =
    {
      _id: '5a6a572368cb6852a68a83d5',
      username: 'frank',
      password: 'frank',
      email: 'frank@ascendtrading.net',
      roles: ['everyone']
    }
  documents.push(frank)

  let number_of_seeds = 60
  // create fake users with "everyone" role
  for (let i = 0; i < number_of_seeds; ++i) {
    let user = {}
    user._id = utils.mongoObjectId()
    user.username = faker.internet.userName()
    user.email = faker.internet.email()
    user.password = faker.internet.password()
    user.roles = ["everyone"]
    documents.push(user)
  }

  let users = {
    model: model,
    documents: documents
  }

  return users
}
