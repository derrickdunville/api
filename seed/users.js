let faker = require('faker')
let utils = require('./utils')
let stripe = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");

exports.seedUsers = async function(){

  let documents = []

  let model = "User"

  // Admin
  let admin =
    {
      _id: '5a6a572368cb6852a68a83d3',
      username: 'admin',
      password: 'admin',
      email: 'tester@ascendtrading.net',
      roles: ['admin']
    }
  documents.push(admin)
  // Admin with stripe_cus_id
  let derrick =
    {
      _id: '5a6a572368cb6852a68a83d4',
      username: 'derrick',
      password: 'derrick',
      email: 'dev@ascendtrading.net',
      roles: ['admin']
    }
  let derrick_stripe_cus = await stripe.customers.create({
      source: 'tok_visa',
      email: derrick.email
    })
  derrick.stripe_cus_id = derrick_stripe_cus.id
  documents.push(derrick)

  // Everone with stripe_cus_id
  let frank =
    {
      _id: '5a6a572368cb6852a68a83d5',
      username: 'frank',
      password: 'frank',
      email: 'frank@ascendtrading.net',
      roles: ['everyone']
    }
  let frank_stripe_cus = await stripe.customers.create({
      source: 'tok_visa',
      email: frank.email
    })
  frank.stripe_cus_id = frank_stripe_cus.id
  documents.push(frank)

  // let number_of_seeds = 60
  // // create fake users with "everyone" role
  // for (let i = 0; i < number_of_seeds; ++i) {
  //   let user = {}
  //   user._id = utils.mongoObjectId()
  //   user.username = faker.internet.userName()
  //   user.email = faker.internet.email()
  //   user.password = faker.internet.password()
  //   user.roles = ["everyone"]
  //   documents.push(user)
  // }

  let users = {
    model: model,
    documents: documents
  }

  return users
}
