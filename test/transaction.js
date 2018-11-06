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

  let postedTransaction = null

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
        // console.log("stripe customer created for newEveryoneUser")
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
      // console.log("BEFORE END")
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
          postedTransaction = res.body
          done()
        })
    })
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

  describe('/GET transactions', () => {
    it('everyone cant get a list of transactions with no token', (done) => {
      chai.request(server)
        .get('/transactions')
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        })
    })
    // what about everyone getting a list of their own transactions
    it('everyone cant get a list of transactions', (done) => {
      chai.request(server)
        .get('/transactions')
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to read transactions")
          done()
        })
    })
    it('admin can get a list of transactions', (done) => {
      chai.request(server)
        .get('/transactions')
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("docs")
          res.body.docs.should.be.a("array")
          res.body.should.have.property("total")
          res.body.total.should.be.a("number")
          res.body.total.should.equal(4)
          res.body.should.have.property("limit")
          res.body.limit.should.be.a("number")
          res.body.limit.should.equal(10) // default when no query option is passed
          res.body.should.have.property("page")
          res.body.page.should.be.a("number")
          res.body.page.should.equal(1)
          res.body.should.have.property("pages")
          res.body.pages.should.be.a("number")
          res.body.pages.should.equal(1)
          var docs = res.body.docs
          for(let i = 0; i < docs.length; ++i){
            var doc = res.body.docs[i]
            doc.should.be.a("object")
            doc.should.have.property("_id")
            doc.should.have.property("user")
            doc.should.have.property("product")
            // doc.should.have.property("trans_num")
            doc.should.have.property("amount")
            doc.should.have.property("amount_refunded")
            doc.should.have.property("tax_amount")
            doc.should.have.property("tax_rate")
            doc.should.have.property("tax_desc")
            doc.should.have.property("tax_compound")
            doc.should.have.property("tax_shipping")
            doc.should.have.property("status")
            doc.should.have.property("txn_type")
            doc.should.have.property("response")
            doc.should.have.property("gateway")
            doc.should.have.property("ip_address")
            doc.should.have.property("prorated")
            doc.should.have.property("created_at")
            doc.should.have.property("expires_at")
            doc.should.have.property("refunded_at")
            doc.should.have.property("end_date")
          }
          done()
        })
    })
  })

  describe('/GET transactions/:transactionId', () => {
    it('everyone cant get a transaction with no token', (done) => {
      chai.request(server)
        .get('/transactions/'+invalidObjectId)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        })
    })
    // what about everyone getting their own transaction?
    it('everyone cant get a transaction', (done) => {
      chai.request(server)
        .get('/transactions/' + invalidObjectId)
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to read transactions")
          done()
        })
    })
    it('admin can get a transaction (filtered for admin)', (done) => {
      chai.request(server)
        .get('/transactions/'+ postedTransaction._id)
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id")
          res.body._id.should.equal(postedTransaction._id)
          res.body.should.have.property("user")
          res.body.user.should.equal(postedTransaction.user)
          res.body.should.have.property("product")
          res.body.product.should.equal(postedTransaction.product)
          res.body.should.have.property("trans_num")
          res.body.should.have.property("amount")
          res.body.should.have.property("amount_refunded")
          res.body.should.have.property("tax_amount")
          res.body.should.have.property("tax_rate")
          res.body.should.have.property("tax_desc")
          res.body.should.have.property("tax_compound")
          res.body.should.have.property("tax_shipping")
          res.body.should.have.property("status")
          res.body.should.have.property("txn_type")
          res.body.should.have.property("response")
          res.body.should.have.property("gateway")
          res.body.should.have.property("ip_address")
          res.body.should.have.property("prorated")
          res.body.should.have.property("created_at")
          res.body.should.have.property("expires_at")
          res.body.should.have.property("refunded_at")
          res.body.should.have.property("end_date")
          done()
        })
    })
  })

  describe('/PUT transactions/:transactionId', () => {
    it('everyone cant update a transaction with no token', (done) => {
      chai.request(server)
        .put('/transactions/'+invalidObjectId)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        })
    })
    it('everyone cant update a transaction', (done) => {
      chai.request(server)
        .put('/transactions/' + invalidObjectId)
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to update transactions")
          done()
        })
    })
    it('admin can update a transaction (refund)', (done) => {
      chai.request(server)
        .put('/transactions/'+ postedTransaction._id)
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send({status: "refunded"})
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id")
          res.body._id.should.equal(postedTransaction._id)
          res.body.should.have.property("user")
          res.body.user.should.equal(postedTransaction.user)
          res.body.should.have.property("product")
          res.body.product.should.equal(postedTransaction.product)
          res.body.should.have.property("trans_num")
          res.body.should.have.property("amount")
          res.body.should.have.property("amount_refunded")
          res.body.should.have.property("tax_amount")
          res.body.should.have.property("tax_rate")
          res.body.should.have.property("tax_desc")
          res.body.should.have.property("tax_compound")
          res.body.should.have.property("tax_shipping")
          res.body.should.have.property("status")
          res.body.status.should.equal("refunded")
          res.body.should.have.property("txn_type")
          res.body.should.have.property("response")
          res.body.should.have.property("gateway")
          res.body.should.have.property("ip_address")
          res.body.should.have.property("prorated")
          res.body.should.have.property("created_at")
          res.body.should.have.property("expires_at")
          res.body.should.have.property("refunded_at")
          res.body.should.have.property("end_date")
          done()
        })
    }).timeout(5000);
  })

  describe('/DELETE transactions/:transactionId', () => {
    it('everyone cant delete a transaction with no token', (done) => {
      chai.request(server)
        .delete('/transactions/' + invalidObjectId)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        })
    })
    it('everyone cant delete a transaction', (done) => {
      chai.request(server)
        .delete('/transactions/' + invalidObjectId)
        .set('Authorization', `Bearer ${testEveryoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to delete transactions")
          done()
        })
    })
    it('admin can delete a transaction', (done) => {
      chai.request(server)
        .delete('/transactions/' + postedTransaction._id)
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a("object")
          res.body.should.have.property("message")
          res.body.message.should.equal("transaction successfully end dated")
          done()
        })
    })
    it('admin should get 404 transaction not found error', (done) => {
      chai.request(server)
        .delete('/transactions/' + invalidObjectId)
        .set('Authorization', `Bearer ${testAdminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("transaction not found")
          done()
        })
    })
  })

  after((done) => {
    Transaction.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      return User.remove({})
    })
    .then(() => {
      done()
    }).catch((err)=> {
      done()
    })
  })
});
