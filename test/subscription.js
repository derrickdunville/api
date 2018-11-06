//During the test the env variable is set to test
process.env.NODE_ENV = 'test'

let mongoose = require("mongoose")
let Subscription = require('../api/models/subscriptionModel')
let stripe = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");
let utils = require('../seed/utils')

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
let should = chai.should()

chai.use(chaiHttp)

describe('Subscription', () => {

  let adminUser = null
  let everyoneUser = null
  let subscriptionProduct = null
  let postedSubscription = null
  let invalidObjectId = utils.mongoObjectId()

  before(function(done) {
    this.timeout(10000)
    User.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      return Subscription.remove({})
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
      everyoneUser = user
      // test admin user
      let testAdminUser = new User({
        email: 'testadmin@ascendtrading.net',
        password: 'testerpw',
        username: 'testadmin',
        roles: ["admin"],
        token: 'testadmintoken'
      })
      return testAdminUser.save()
    })
    .then(async (user) => {
      adminUser = user
      let newProduct = new Product({
        name: 'test membership',
        currency: 'USD',
        interval: 'month',
        category: 'membership',
        access: 'expire',
        amount: '2000'
      })
      let plan = await stripe.plans.create({
        amount: newProduct.amount,
        interval: newProduct.interval,
        name: newProduct.name,
        currency: newProduct.currency
      })
      newProduct.stripe_plan_id = plan.id
      return newProduct.save()
    }).then(product => {
      subscriptionProduct = product
      done()
    }).catch(err => {
      console.dir(err)
      done()
    })
  })

  describe('POST /subscriptions', () => {
    it('everyone cant create a new subscription with no token', (done) => {
      chai.request(server)
        .post('/subscriptions')
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
    it('everyone can create a new subscription', (done) => {
      chai.request(server)
        .post('/subscriptions')
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send({product: subscriptionProduct._id})
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id")
          res.body.should.have.property("product")
          res.body.product.should.equal(subscriptionProduct._id.toString())
          res.body.should.have.property("subscription_id")
          res.body.should.have.property("user")
          res.body.user.should.equal(everyoneUser._id.toString())
          postedSubscription = res.body
          done()
        })
    }).timeout(10000)
  })
  describe('GET /subscriptions', () => {
    it('everyone cant get a list of subscriptions with no token', (done) => {
      chai.request(server)
        .get('/subscriptions')
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
    it('everyone cant get a list of subscriptions', (done) => {
      chai.request(server)
        .get('/subscriptions')
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(401)
            res.body.should.be.a("object")
            res.body.should.have.property("err")
            res.body.err.should.have.property("message")
            res.body.err.message.should.equal("You are not authorized to read subscriptions")
            done()
        })
    })
    it('admin can get a list of subscriptions', (done) => {
      chai.request(server)
        .get('/subscriptions')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("total")
            done()
        })
    })
  })
  describe('GET /subscriptions/:subscriptionId', () => {
    it('everyone cant get a subscription with no token', (done) => {
      chai.request(server)
        .get('/subscriptions/'+ postedSubscription._id.toString())
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
    it('everyone cant get a subscription', (done) => {
      chai.request(server)
        .get('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(401)
            res.body.should.be.a("object")
            res.body.should.have.property("err")
            res.body.err.should.have.property("message")
            res.body.err.message.should.equal("You are not authorized to read subscriptions")
            done()
        })
    })
    it('admin can get a subscription', (done) => {
      chai.request(server)
        .get('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("_id")
            res.body._id.should.equal(postedSubscription._id.toString())
            done()
        })
    })
  })
  describe('PUT /subscriptions/:subscriptionId', () => {
    it('everyone cant update a subscription with no token', (done) => {
      chai.request(server)
        .put('/subscriptions/'+ postedSubscription._id.toString())
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
    it('everyon can update own subscription (cancel_at_period_end)', (done) => {
      chai.request(server)
        .put('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send({cancel_at_period_end: true})
        .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("_id")
            res.body._id.should.equal(postedSubscription._id.toString())
            res.body.should.have.property("cancel_at_period_end").equal(true)
            done()
        })
    })
    it('admin can update any subscription (cancel_at_period_end)', (done) => {
      chai.request(server)
        .put('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({cancel_at_period_end: true})
        .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("_id")
            res.body._id.should.equal(postedSubscription._id.toString())
            res.body.should.have.property("cancel_at_period_end").equal(true)
            done()
        })
    })
  })
  describe('DELETE /subscriptions/:subscriptionId', () => {
    it('everyone cant delete a subscription with no token', (done) => {
      chai.request(server)
        .delete('/subscriptions/'+ postedSubscription._id.toString())
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
    it('everyone cant delete a subscription', (done) => {
      chai.request(server)
        .delete('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(401)
            res.body.should.be.a("object")
            res.body.should.have.property("err")
            res.body.err.should.have.property("message")
            res.body.err.message.should.equal("You are not authorized to delete subscriptions")
            done()
        })
    })
    it('admin should get subscription not found error', (done) => {
      chai.request(server)
        .delete('/subscriptions/'+ invalidObjectId.toString())
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(404)
            done()
        })
    })
    it('admin can delete a subscription', (done) => {
      chai.request(server)
        .delete('/subscriptions/'+ postedSubscription._id.toString())
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
            res.should.have.status(200)
            done()
        })
    })
  })

  after((done) => {
    User.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      return Subscription.remove({})
    })
    .then(() => {
      done()
    })
    .catch(err => {
      console.dir(err)
      done()
    })
  })
})
