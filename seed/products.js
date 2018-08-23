let faker = require('faker')
let utils = require('./utils')
let stripe = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");


exports.testProduct = {
    _id: "5a8eac0f5b4e7158a8559d71",
    stripe_plan_id: "plan_diamond_monthly",
    name: "Diamond",
    amount: 99.99,
    description: "Diamond (Monthly)",
    create_date: "2018-02-22T11:39:59.000Z",
    expire_after_interval_amount: 0,
    access_after_last_cycle: "expire access",
    max_number_of_payments: 0,
    limit_payment_cycles: false,
    allow_only_one_trial: false,
    trial_amount: 0,
    trial_duration_days: 0,
    trial_period: false,
    allow_renewals: false,
    access: "expire",
    interval: "month",
    currency: "usd"
  }

exports.seedProducts = async function(){
  let model = "Product"
  let documents = []

  console.log("creating product seeds...")
  // Diamond
  let stripe_product =
    {
      _id: "5a8eac0f5b4e7158a8559d71",
      stripe_plan_id: '',
      name: "Diamond",
      amount: 99.99,
      description: "Diamond (Monthly)",
      create_date: "2018-02-22T11:39:59.000Z",
      expire_after_interval_amount: 0,
      access_after_last_cycle: "expire access",
      max_number_of_payments: 0,
      limit_payment_cycles: false,
      allow_only_one_trial: false,
      trial_amount: 0,
      trial_duration_days: 0,
      trial_period: false,
      allow_renewals: false,
      access: "expire",
      interval: "month",
      currency: "usd",
      category: "membership",
      discord_role_id: "477252690309808140"
    }
  let test_plan = await stripe.plans.create({
    amount: 9999,
    interval: "month",
    product: {
      name: stripe_product.name
    },
    currency: 'usd'
  })
  console.log("stripe test plan: ")
  console.dir(test_plan)
  stripe_product.stripe_plan_id = test_plan.id
  documents.push(stripe_product)

  // Test one-time product
  let one_time_product = {
    _id: utils.mongoObjectId(),
    name: 'test script',
    interval: 'one-time',
    amount: '100',
    description: 'test script description',
    category: 'script',
  }
  documents.push(one_time_product)

  // // create fake products
  // let number_of_seeds = 25
  // for (let i = 0; i < number_of_seeds; ++i) {
  //   let product = {}
  //   product._id = utils.mongoObjectId()
  //   product.name = faker.commerce.productName() + " Class"
  //   product.interval = "one-time"
  //   product.amount = faker.commerce.price()
  //   product.description = "test description"
  //   product.category = "class"
  //   documents.push(product)
  // }
  // number_of_seeds = 11
  // for (let i = 0; i < number_of_seeds; ++i) {
  //   let product = {}
  //   product._id = utils.mongoObjectId()
  //   product.name = faker.commerce.productName() + " Scanner"
  //   product.interval = "one-time"
  //   product.amount = faker.commerce.price()
  //   product.description = "test description"
  //   product.category = "scanner"
  //   documents.push(product)
  // }
  // number_of_seeds = 16
  // for (let i = 0; i < number_of_seeds; ++i) {
  //   let product = {}
  //   product._id = utils.mongoObjectId()
  //   product.name = faker.commerce.productName() + " Script"
  //   product.interval = "one-time"
  //   product.amount = faker.commerce.price()
  //   product.description = "test description"
  //   product.category = "script"
  //   documents.push(product)
  // }

  let products = {
    model: model,
    documents: documents
  }

  console.log("done creating product seeds")
  return products
};
