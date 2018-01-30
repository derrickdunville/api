//During the test the env variable is set to test
process.env.NODE_ENV = 'test'

let mongoose = require("mongoose")
let Product = require('../api/models/productModel')

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
let should = chai.should()

chai.use(chaiHttp)
//Our parent block
describe('Product', () => {

  let now = new Date()
  let testDate = new Date()
  testDate.setYear(now.getYear() + 1)
  let testProduct = {
    name: "Test Product",
    amount: 99.99,
    interval: "one-time"
  }
  let planProduct = {
    name: "Test Plan",
    amount: 99.99,
    interval: "month"
  }

  beforeEach((done) => { //Before each test we empty the database
      Product.remove({}, (err) => {
          done();
      })
  })

  describe('/POST products', () => {
    it('it should POST a new product', (done) => {
      chai.request(server)
          .post('/products')
          .send(testProduct)
          .end((err, res) => {
              res.should.have.status(201)
              res.body.should.be.a("object")
              done()
          })
    })
  })

  describe('/POST products', () => {
    it('it should POST a new product and create a stripe plan', (done) => {
      chai.request(server)
          .post('/products')
          .send(planProduct)
          .end((err, res) => {
              res.should.have.status(201)
              res.body.should.be.a("object")
              res.body.should.have.property("stripe_plan_id")
              done()
          })
    })
  })

  describe('/PUT products/:productId', () => {
    it('it should Update an existing product', (done) => {
      let product = new Product(testProduct)
      product.save((err, product) => {
        let updatedProduct = product
        updatedProduct.amount = 199.99
        chai.request(server)
            .put('/products/' + product._id)
            .send(updatedProduct)
            .end((err, res) => {
                res.should.have.status(201)
                res.body.should.be.a("object")
                done()
            })
      })
    })
  })

  describe('/GET products', () => {
    it('it should GET an array of products', (done) => {
      let product = new Product(testProduct)
      product.save((err, product) => {
        chai.request(server)
            .get('/products')
            .end((err, res) => {
                res.should.have.status(201)
                res.body.should.be.a("array")
                let fisrtProduct = res.body[0]
                fisrtProduct.should.be.a("object")
                done()
            })
      })
    })
  })

  describe('/GET products/:productId', () => {
    it('it should GET a product', (done) => {
      let product = new Product(testProduct)
      product.save((err, product) => {
        chai.request(server)
            .get('/products/' + product._id)
            .end((err, res) => {
              res.should.have.status(201)
              res.body.should.be.a("object")
              done()
            })
      })
    })
  })

  describe('/DELETE products/:productId', () => {
    it('it should DELETE a product', (done) => {
      let product = new Product(testProduct)
      product.save((err, product) => {
        chai.request(server)
            .delete('/products/' + product._id)
            .end((err, res) => {
                res.should.have.status(201)
                res.body.should.have.property("message").eql("product successfully end dated")
                done()
            })
      })
    })
  })

});
