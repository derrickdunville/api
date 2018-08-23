//During the test the env variable is set to test
process.env.NODE_ENV = 'test'

let mongoose = require("mongoose")
let utils = require('../seed/utils')
let Transaction = require('../api/models/transactionModel')
let User = require('../api/models/userModel')
let Product = require('../api/models/productModel')
let stripe = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
let should = chai.should()

chai.use(chaiHttp)
//Our parent block
describe('Transaction', () => {
  let invalidObjectId = utils.mongoObjectId()
  let invalidUserObjectId = utils.mongoObjectId()
  let testEveryoneUser = null   // This will be seeded in before each
  let testAdminUser = null
  let testProduct = null // This will be seeded in before each
  let testProduct2 = null
  let testProduct3 = null

  let now = new Date()
  let testDate = new Date()
  testDate.setYear(now.getYear() + 1)
  let testTransaction = {
    amount: 99.99,
    total: 99.99,
    tax_amount: 0.00,
    tax_rate: 0.00,
    tax_desc: "n/a",
    tax_compound: false,
    tax_shipping: false,
    tax_class: "standard",
    user: null,
    product: null,
    trans_num: "testtxnnumber",
    status: "pending",
    txn_type: "payment",
    response: "test response",
    gateway: "manual",
    subscription_id: "testsubid",
    ip_address: "127.0.0.1",
    prorated: false,
    expires_at: testDate
  }

  before((done) => { //Before each test we empty the database
    console.log("BEFORE BEGIN")
      Transaction.remove({})
      .then(() => {
        return Product.remove({})
      })
      .then(() => {
        return User.remove({})
      })
      .then(async () => {
        let newEveryoneUser = new User({
          username: 'tester',
          password: 'testpw',
          email: 'tester@ascendtrading.net',
          token: 'testtoken'
        })
        let customer = await stripe.customers.create({
          source: 'tok_visa',
          email: newEveryoneUser.email
        })
        newEveryoneUser.stripe_cus_id = customer.id
        console.log("stripe customer created for newEveryoneUser")
        return newEveryoneUser.save()
      })
      .then(user => {
        testEveryoneUser = user
        let newAdminUser = new User({
          username: 'admin_tester',
          password: 'admin_testpw',
          email: 'admin_tester@ascendtrading.net',
          token: 'admin_testtoken',
          roles: ['admin']
        })
        return newAdminUser.save()
      })
      .then(user => {
        testAdminUser = user
        let newProduct = new Product({
          name: 'test script',
          currency: 'USD',
          interval: 'one-time',
          category: 'script',
          access: 'lifetime',
          amount: '1000'
        })
        return newProduct.save()
      })
      .then(product => {
        testProduct = product
        let newProduct = new Product({
          name: 'test script 2',
          currency: 'USD',
          interval: 'one-time',
          category: 'script',
          access: 'lifetime',
          amount: '2000'
        })
        return newProduct.save()
      })
      .then(product2 => {
        testProduct2 = product2
        let newProduct = new Product({
          name: 'test script 3',
          currency: 'USD',
          interval: 'one-time',
          category: 'script',
          access: 'lifetime',
          amount: '3000'
        })
        return newProduct.save()
      })
      .then(product3 => {
        testProduct3 = product3
        done()
      })
      .catch(err => {
        console.log(err)
      })
      console.log("BEFORE END")
  })

  describe('/POST transactions', () => {
    it('it should fail and return provide token err', (done) => {
      chai.request(server)
      .post('/transactions')
      .send({product: testProduct._id})
      .end((err, res) => {
        // console.log("res.body")
        // console.log(res.body)
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('err')
        done()
      })
    })
  })

  describe('/POST transactions', () => {
    it('it should POST a new transaction', (done) => {
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send({product: testProduct._id})
        .end((err, res) => {
          // console.log('res.body')
          // console.dir(res.body)
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property('product')
          res.body.should.have.property('user')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('it should POST a new transaction for a previously purchased product and sould fail', (done) => {
      // create the previous transaction
      let newTransaction = new Transaction({
        user: testEveryoneUser._id,
        product: testProduct._id,
        amount: testProduct.amount,
        total: testProduct.amount
      })
      newTransaction.save()
      .then(transaction => {
        chai.request(server)
          .post('/transactions')
          .set('Authorization', `Bearer ${testEveryoneUser.token}`)
          .send({product: testProduct._id})
          .end((err, res) => {
            // console.log('res.body')
            // console.dir(res.body)
            res.should.have.status(403)
            res.body.should.be.a("object")
            res.body.should.have.property('err')
            done()
          })
      }).catch(err => {
        console.log("error creating transaction")
        done()
      })
    })
  })

  describe('/POST transactions', () => {
    it('it should POST a new transaction for a different product', (done) => {
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send({product: testProduct2._id})
        .end((err, res) => {
          // console.log('res.body')
          // console.dir(res.body)
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property('product')
          res.body.should.have.property('user')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('it should POST a transaction for an invalid product id and return CastError - Cast to ObjectId', (done) => {
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send({product: 'invalid_id'})
        .end((err, res) => {
          // console.log('res.body')
          // console.dir(res.body)
          res.should.have.status(500)
          res.body.should.be.a("object")
          res.body.should.have.property('err')
          res.body.err.should.have.property('message')
          res.body.err.message.should.be.a('string')
          res.body.err.message.should.equal('Cast to ObjectId failed for value "invalid_id" at path "_id" for model "Product"')
          res.body.err.should.have.property('name')
          res.body.err.name.should.be.a('string')
          res.body.err.name.should.equal('CastError')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('it should POST a transaction for an invalid product id for an invalid ObjectId', (done) => {
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send({product: invalidObjectId})
        .end((err, res) => {
          // console.log('res.body')
          // console.dir(res.body)
          res.should.have.status(500)
          res.body.should.be.a("object")
          res.body.should.have.property('err')
          res.body.err.should.have.property('message')
          res.body.err.message.should.equal('product id not found')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('Admin should successfully POST a transaction for someone else', (done) => {

      let testTransaction = {
        amount: testProduct3.amount,
        total: testProduct3.amount,
        tax_amount: 0.00,
        tax_rate: 0.00,
        tax_desc: "n/a",
        tax_compound: false,
        tax_shipping: false,
        tax_class: "standard",
        user: testEveryoneUser,
        product: testProduct3,
        trans_num: "testtxnnumber",
        status: "succeeded",
        gateway: "manual"
      }

      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send(testTransaction)
        .end((err, res) => {
          // console.log('res.body')
          // console.dir(res.body)
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('amount')
          res.body.amount.should.equal(testTransaction.amount)
          res.body.should.have.property('total')
          res.body.total.should.equal(testTransaction.total)
          res.body.should.have.property('user')
          res.body.user.should.equal(testEveryoneUser._id.toString())
          res.body.should.have.property('product')
          res.body.product.should.equal(testProduct3._id.toString())
          res.body.should.have.property('trans_num')
          res.body.trans_num.should.equal(testTransaction.trans_num)
          res.body.should.have.property('status')
          res.body.status.should.equal('succeeded')
          res.body.should.have.property('gateway')
          res.body.gateway.should.equal('manual')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('Admin should POST a transaction for someone else that doesn\'t exist', (done) => {
      let testTransaction = {
        amount: testProduct3.amount,
        total: testProduct3.amount,
        tax_amount: 0.00,
        tax_rate: 0.00,
        tax_desc: "n/a",
        tax_compound: false,
        tax_shipping: false,
        tax_class: "standard",
        user: invalidUserObjectId,
        product: testProduct3,
        trans_num: "testtxnnumber",
        status: "succeeded",
        gateway: "manual"
      }
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send(testTransaction)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property('err')
          res.body.err.should.have.property('message')
          res.body.err.message.should.equal('invalid user id')
          done()
        })
    })
  })

  describe('/POST transactions', () => {
    it('Admin should POST a transaction for someone else where the product doesn\'t exist', (done) => {
      let testTransaction = {
        amount: testProduct3.amount,
        total: testProduct3.amount,
        tax_amount: 0.00,
        tax_rate: 0.00,
        tax_desc: "n/a",
        tax_compound: false,
        tax_shipping: false,
        tax_class: "standard",
        user: testEveryoneUser,
        product: invalidObjectId,
        trans_num: "testtxnnumber",
        status: "succeeded",
        gateway: "manual"
      }
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send(testTransaction)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property('err')
          res.body.err.should.have.property('message')
          res.body.err.message.should.equal('invalid product id')
          done()
        })
    })
  })
  after((done) => {
  // runs after all tests in this block
  // Remove all records that were created
  console.log("AFTER BEGIN")
    Transaction.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      return User.remove({})
    })
    .then(() => {
      console.log("AFTER END")
      done()
    }).catch((err)=> {
      console.log("after error: ", err)
      done()
    })
  })

});
//
//   describe('/PUT transactions/:transactionId', () => {
//     it('it should Update an existing transaction', (done) => {
//       let transaction = new Transaction(testTransaction)
//       transaction.save((err, transaction) => {
//         let updatedTransaction = transaction
//         updatedTransaction.price = 199.99
//         chai.request(server)
//             .put('/transactions/' + transaction._id)
//             .send(updatedTransaction)
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.be.a("object")
//                 done()
//             })
//       })
//     })
//   })
//
//   describe('/GET transactions', () => {
//     it('it should GET an array of transactions', (done) => {
//       let transaction = new Transaction(testTransaction)
//       transaction.save((err, transaction) => {
//         chai.request(server)
//             .get('/transactions')
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.be.a("array")
//                 let fisrtTransaction = res.body[0]
//                 fisrtTransaction.should.be.a("object")
//                 done()
//             })
//       })
//     })
//   })
//
//   describe('/GET transactions/:transactionId', () => {
//     it('it should GET a transaction', (done) => {
//       let transaction = new Transaction(testTransaction)
//       transaction.save((err, transaction) => {
//         chai.request(server)
//             .get('/transactions/' + transaction._id)
//             .end((err, res) => {
//               res.should.have.status(201)
//               res.body.should.be.a("object")
//               done()
//             })
//       })
//     })
//   })
//
//   describe('/DELETE transactions/:transactionId', () => {
//     it('it should DELETE a transaction', (done) => {
//       let transaction = new Transaction(testTransaction)
//       transaction.save((err, transaction) => {
//         chai.request(server)
//             .delete('/transactions/' + transaction._id)
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.have.property("message").eql("transaction successfully end dated")
//                 done()
//             })
//       })
//     })
//   })
//
// });
