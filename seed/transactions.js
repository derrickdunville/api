let faker = require('faker')
let utils = require('./utils')
let products = require('./products')

let transactions = []
let number_of_seeds = 60

createTransactionSeed = function(user, product){
  let transaction = {}
  transaction._id = utils.mongoObjectId()
  transaction.user = user._id
  transaction.product = product._id
  transaction.amount = product.amount
  transaction.total = product.amount
  return transaction
}

exports.seedTransactions = function(users, product_list){


  let documents = []
  let product = products.testProduct

  console.log(product)
  // make a transaction for each user
  for (user in users){
    documents.push(createTransactionSeed(user, product))
  }

  let transactions = {
    modal: "Transaction",
    documents: documents
  }

  return transactions
}
