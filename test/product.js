//During the test the env variable is set to test
process.env.NODE_ENV = 'test'

let mongoose = require("mongoose")
let Product = require('../api/models/productModel')
let fs = require("fs");
let utils = require('../seed/utils')
//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
let should = chai.should()

chai.use(chaiHttp)
//Our parent block
describe('Product', () => {

  let adminUser = null
  let everyoneUser = null
  let invalidProductObjectId = utils.mongoObjectId()

  let now = new Date()
  let testDate = new Date()
  testDate.setYear(now.getYear() + 1)
  let scriptProduct = {
    name: "Script 1",
    amount: 1999,
    interval: "one-time",
    category: "script"
  }
  let scriptProduct2 = {
    name: "Script 2",
    amount: 2999,
    interval: "one-time",
    category: "script"
  }
  let scriptProduct3 = {
    name: "Script 3",
    amount: 2999,
    interval: "one-time",
    category: "script"
  }
  let classProduct = {
    name: "Class 1",
    amount: 3999,
    interval: "one-time",
    category: "class"
  }
  let classProduct2 = {
    name: "Class 2",
    amount: 4999,
    interval: "one-time",
    category: "class"
  }
  let planProduct = {
    name: "Plan 1",
    amount: 9999,
    interval: "month",
    category: "membership"
  }
  let planProduct2 = {
    name: "Plan 2",
    amount: 8999,
    interval: "month",
    category: "membership"
  }


  before((done) => {
    User.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      // test admin user
      let testAdminUser = new User({
        email: 'tester@ascendtrading.net',
        password: 'testerpw',
        username: 'tester',
        roles: ["admin"],
        token: 'testadmintoken'
      })
      return testAdminUser.save()
    })
    .then(user => {
      adminUser = user
      // test everyone user
      let testEveryoneUser = new User({
        email: 'everyoneuser@ascendtrading.net',
        password: 'testerpw',
        username: 'everyoneuser',
        token: 'testeveryonetoken'
      })
      return testEveryoneUser.save()
    })
    .then(user => {
      everyoneUser = user
      done()
    }).catch(err => {
      done()
    })
  });

  describe('/POST products', () => {
    it('everyone cant post a product with no token', (done) => {
      chai.request(server)
        .post('/products')
        .field('product', JSON.stringify(scriptProduct))
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
    it('everyone cant post a product', (done) => {
      chai.request(server)
        .post('/products')
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('product', JSON.stringify(scriptProduct))
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to create products")
          done()
        })
    })
    it('admin can create a product (script)', (done) => {
      chai.request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('product', JSON.stringify(scriptProduct2))
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          done()
        })
    })
    // Good
    it('admin can create a product (script) with cover image and file', (done) => {
      chai.request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('product', JSON.stringify(scriptProduct3))
        .attach('cover_image', fs.readFileSync(process.cwd() + '/test/profile1.png'), 'profile1.png')
        .attach('uploaded_file', fs.readFileSync(process.cwd() + '/test/test_file.txt'), 'test_file.txt')
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          done()
        })
    })
    it('admin can create a product (membership)', (done) => {
      chai.request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('product', JSON.stringify(planProduct))
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("stripe_plan_id")
          done()
        })
    })
    it('admin can create a product (membership) wtih cover image', (done) => {
      chai.request(server)
        .post('/products')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('product', JSON.stringify(planProduct2))
        .attach('cover_image', fs.readFileSync(process.cwd() + '/test/profile1.png'), 'profile1.png')
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("stripe_plan_id")
          done()
        })
    })
  })
  describe('/GET products', () => {
    it('public can get a list of products (filtered for public)', (done) => {
      chai.request(server)
        .get('/products/')
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
            doc.should.have.property("currency")
            doc.should.have.property("interval")
            doc.should.have.property("name")
            doc.should.have.property("amount")
            doc.should.have.property("description")
            doc.should.have.property("category")
            doc.should.have.property("access")
            doc.should.have.property("allow_renewals")
            doc.should.have.property("trial_period")
            doc.should.have.property("trial_duration_days")
            doc.should.have.property("trial_amount")
            doc.should.have.property("allow_only_one_trial")
            doc.should.have.property("limit_payment_cycles")
            doc.should.have.property("max_number_of_payments")
            doc.should.have.property("access_after_last_cycle")
            doc.should.have.property("expire_after_interval_amount")
            doc.should.have.property("created_at")
            doc.should.not.have.property("end_date")
            doc.should.have.property("cover_image")
            doc.should.not.have.property("file")
          }
          done()
        })
    })
    it('everyone can get a list of products (filtered for everyone)', (done) => {
      chai.request(server)
        .get('/products/')
        .set('Authorization', `Bearer ${everyoneUser.token}`)
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
            doc.should.have.property("currency")
            doc.should.have.property("interval")
            doc.should.have.property("name")
            doc.should.have.property("amount")
            doc.should.have.property("description")
            doc.should.have.property("category")
            doc.should.have.property("access")
            doc.should.have.property("allow_renewals")
            doc.should.have.property("trial_period")
            doc.should.have.property("trial_duration_days")
            doc.should.have.property("trial_amount")
            doc.should.have.property("allow_only_one_trial")
            doc.should.have.property("limit_payment_cycles")
            doc.should.have.property("max_number_of_payments")
            doc.should.have.property("access_after_last_cycle")
            doc.should.have.property("expire_after_interval_amount")
            doc.should.have.property("created_at")
            doc.should.not.have.property("end_date")
            doc.should.have.property("cover_image")
            doc.should.not.have.property("file")
          }
          done()
        })
    })
    it('admin can get a list of products (filtered for admin)', (done) => {
      chai.request(server)
        .get('/products/')
        .set('Authorization', `Bearer ${adminUser.token}`)
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
            doc.should.have.property("currency")
            doc.should.have.property("interval")
            doc.should.have.property("name")
            doc.should.have.property("amount")
            doc.should.have.property("description")
            doc.should.have.property("category")
            doc.should.have.property("access")
            doc.should.have.property("allow_renewals")
            doc.should.have.property("trial_period")
            doc.should.have.property("trial_duration_days")
            doc.should.have.property("trial_amount")
            doc.should.have.property("allow_only_one_trial")
            doc.should.have.property("limit_payment_cycles")
            doc.should.have.property("max_number_of_payments")
            doc.should.have.property("access_after_last_cycle")
            doc.should.have.property("expire_after_interval_amount")
            doc.should.have.property("created_at")
            doc.should.not.have.property("end_date")
            doc.should.have.property("cover_image")
            doc.should.have.property("file")
          }
          done()
        })
    })
  })
  describe('/GET products/:productId', () => {
    it('public can get a product (filtered for public)', (done) => {
      let scriptProduct4 = new Product({
        name: "Script 4",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct4.save()
      .then(product => {
        chai.request(server)
          .get('/products/' + product._id)
          .send()
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.not.have.property("file")
            done()
          })
      }).catch(err => {
        console.dir(err)
        done()
      })
    })
    it('everyone can get a product (filtered for everyone)', (done) => {
      let scriptProduct5 = new Product({
        name: "Script 5",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct5.save()
      .then(product => {
        chai.request(server)
          .get('/products/' + product._id)
          .set('Authorization', `Bearer ${everyoneUser.token}`)
          .send()
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.not.have.property("file")
            done()
          })
      }).catch(err => {
        console.dir(err)
        done()
      })
    })
    it('admin can get a product (filtered for admin)', (done) => {
      let scriptProduct = new Product({
        name: "Script 10",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct.save()
      .then(product => {
        chai.request(server)
          .get('/products/' + product._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .send()
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("file")
            done()
          })
      }).catch(err => {
        console.dir(err)
        done()
      })
    })
    it('everyone gets product not found error', (done) => {
      chai.request(server)
        .get('/products/' + invalidProductObjectId)
        .send()
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("product not found")
          done()
        })
    })
    it('everyone gets cast to objectID error', (done) => {
      chai.request(server)
        .get('/products/' + "casterror")
        .send()
        .end((err, res) => {
          res.should.have.status(500)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.should.have.property("name")
          res.body.err.name.should.equal("CastError")
          done()
        })
    })
  })
  describe('/DELETE products/:productId', () => {
    it('everyone cant delete product with no token', (done) => {
      let scriptProduct6 = new Product({
        name: "Script 6",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct6.save((err, product) => {
        chai.request(server)
          .delete('/products/' + product._id)
          .end((err, res) => {
            res.should.have.status(403)
            // res.body.should.have.property("message").eql("product successfully end dated")
            done()
          })
      })
    })
    it('everyone cant delete product', (done) => {
      let scriptProduct7 = new Product({
        name: "Script 7",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct7.save((err, product) => {
        chai.request(server)
          .delete('/products/' + product._id)
          .set('Authorization', `Bearer ${everyoneUser.token}`)
          .end((err, res) => {
            res.should.have.status(401)
            res.body.should.have.property("message").eql("You are not authorized to delete products")
            done()
          })
      })
    })
    it('admin can delete product', (done) => {
      let scriptProduct8 = new Product({
        name: "Script 8",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      scriptProduct8.save((err, product) => {
        chai.request(server)
          .delete('/products/' + product._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.have.property("message").eql("product successfully end dated")
            done()
          })
      })
    })
    it('admin gets product not found error', (done) => {
      chai.request(server)
        .delete('/products/' + invalidProductObjectId)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.err.should.have.property("message").eql("product not found")
          done()
        })
    })
  })

  describe('/PUT products/:productId', () => {
    it('everyone cant update product with no token', (done) => {
      let product = new Product({
        name: "Script 11",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      product.save()
      .then(product => {
        let updatedProduct = product
        updatedProduct.amount = 199.99
        chai.request(server)
          .put('/products/' + updatedProduct._id)
          .field('product', JSON.stringify(updatedProduct))
          .send(updatedProduct)
          .end((err, res) => {
              res.should.have.status(403)
              res.body.should.be.a("object")
              res.body.should.have.property("err")
              res.body.err.should.have.property("message")
              res.body.err.message.should.equal("Authorization Token not provided")
              done()
          })
      }).catch(err => {
        console.dir(err)
        done()
      })
    })
    it('everyone cant update product', (done) => {
      let product = new Product({
        name: "Script 12",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      product.save((err, product) => {
        let updatedProduct = product
        updatedProduct.amount = 199.99
        chai.request(server)
          .put('/products/' + updatedProduct._id)
          .set('Authorization', `Bearer ${everyoneUser.token}`)
          .field('product', JSON.stringify(updatedProduct))
          .send(updatedProduct)
          .end((err, res) => {
              res.should.have.status(401)
              res.body.should.be.a("object")
              res.body.should.have.property("err")
              res.body.err.should.have.property("message")
              res.body.err.message.should.equal("You are not authorized to update products")
              done()
          })
      })
    })
    it('admin can update product cover image', (done) => {
      let product = new Product({
        name: "Script 14",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      product.save((err, product) => {
        let updatedProduct = product
        updatedProduct.amount = 1999
        chai.request(server)
          .put('/products/' + updatedProduct._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .field('product', JSON.stringify(updatedProduct))
          .attach('cover_image', fs.readFileSync(process.cwd() + '/test/profile1.png'), 'profile1.png')
          .send()
          .end((err, res) => {
              res.should.have.status(201)
              res.body.should.be.a("object")
              res.body.should.have.property("cover_image")
              res.body.cover_image.should.have.property("bucket")
              res.body.cover_image.should.have.property("key")
              done()
          })
      })
    })
    it('admin can update product file', (done) => {
      let product = new Product({
        name: "Script 15",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      product.save((err, product) => {
        let updatedProduct = product
        updatedProduct.amount = 1999
        chai.request(server)
          .put('/products/' + updatedProduct._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .field('product', JSON.stringify(updatedProduct))
          .attach('uploaded_file', fs.readFileSync(process.cwd() + '/test/test_file.txt'), 'test_file.txt')
          .send()
          .end((err, res) => {
              res.should.have.status(201)
              res.body.should.be.a("object")
              res.body.should.have.property("file")
              res.body.file.should.have.property("bucket")
              res.body.file.should.have.property("key")
              done()
          })
      })
    })
    it('admin can update product description', (done) => {
      let product = new Product({
        name: "Script 16",
        amount: 2999,
        interval: "one-time",
        category: "script",
        description: "Script 16 description"
      })
      product.save((err, product) => {
        let updatedProduct = {
          description: "updated description"
        }
        chai.request(server)
          .put('/products/' + product._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .field('product', JSON.stringify(updatedProduct))
          .send()
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("description")
            res.body.description.should.equal("updated description")
            done()
          })
      })
    })
    it('admin cant update product price', (done) => {
      let product = new Product({
        name: "Script 13",
        amount: 2999,
        interval: "one-time",
        category: "script"
      })
      product.save((err, product) => {
        let updatedProduct = product
        updatedProduct.amount = 1999
        chai.request(server)
          .put('/products/' + updatedProduct._id)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .field('product', JSON.stringify(updatedProduct))
          .send()
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("amount")
            res.body.amount.should.equal(2999)
            done()
          })
      })
    })
  })


  after((done) => {
    User.remove({})
    .then(() => {
      return Product.remove({})
    })
    .then(() => {
      done()
    }).catch(err => {
      done()
    })
  });
});
