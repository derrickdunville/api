let faker = require('faker')
let utils = require('./utils')


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

exports.seedProducts = function(){
  let model = "Product"
  let documents = []

  // Diamond
  let stripe_product =
    {
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
  documents.push(stripe_product)

  // create fake products
  let number_of_seeds = 60
  for (let i = 0; i < number_of_seeds; ++i) {
    let product = {}
    product._id = utils.mongoObjectId()
    product.name = faker.commerce.productName()
    product.interval = "one-time"
    product.amount = faker.commerce.price()
    product.description = "test description"
    documents.push(product)
  }

  let products = {
    model: model,
    documents: documents
  }

  return products
};
