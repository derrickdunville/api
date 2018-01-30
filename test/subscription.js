// //During the test the env variable is set to test
// process.env.NODE_ENV = 'test'
//
// let mongoose = require("mongoose")
// let Subscription = require('../api/models/subscriptionModel')
//
// //Require the dev-dependencies
// let chai = require('chai')
// let chaiHttp = require('chai-http')
// let server = require('../server')
// let should = chai.should()
//
// chai.use(chaiHttp)
// //Our parent block
// describe('Subscription', () => {
//
//   let now = new Date()
//   let testDate = new Date()
//   testDate.setYear(now.getYear() + 1)
//   let testSubscription = {
//     // user_id: "need to create a user",
//     // product_id: "need to create a product"
//     subscription_id: "testsubid",
//     price: 99.99,
//     total: 99.99,
//     tax_amount: 0.00,
//     tax_rate: 0.00,
//     tax_desc: "n/a",
//     tax_compound: false,
//     tax_shipping: false,
//     tax_class: "standard",
//     gateway: "manual",
//     response: "test response",
//     ip_address: "127.0.0.1",
//     period: 1,
//     period_type: "months",
//     limit_cycles: false,
//     limit_cycles_num: 1,
//     limit_cycles_action: "lifetime",
//     prorated_trial: false,
//     trial: false,
//     trial_days: 1,
//     trial_amount: 0.00,
//     status: "pending",
//     cc_last4: "0123",
//     cc_exp_month: "02",
//     cc_exp_year: "2020"
//   }
//
//   beforeEach((done) => { //Before each test we empty the database
//       Subscription.remove({}, (err) => {
//           done();
//       })
//   })
//
//   describe('/POST subscriptions', () => {
//     it('it should POST a new subscription', (done) => {
//       chai.request(server)
//           .post('/subscriptions')
//           .send(testSubscription)
//           .end((err, res) => {
//               res.should.have.status(201)
//               res.body.should.be.a("object")
//               done()
//           })
//     })
//   })
//
//   describe('/PUT subscriptions/:subscriptionId', () => {
//     it('it should Update an existing subscription', (done) => {
//       let subscription = new Subscription(testSubscription)
//       subscription.save((err, subscription) => {
//         let updatedSubscription = subscription
//         updatedSubscription.price = 199.99
//         chai.request(server)
//             .put('/subscriptions/' + subscription._id)
//             .send(updatedSubscription)
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.be.a("object")
//                 done()
//             })
//       })
//     })
//   })
//
//   describe('/GET subscriptions', () => {
//     it('it should GET an array of subscriptions', (done) => {
//       let subscription = new Subscription(testSubscription)
//       subscription.save((err, subscription) => {
//         chai.request(server)
//             .get('/subscriptions')
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.be.a("array")
//                 let fisrtSubscription = res.body[0]
//                 fisrtSubscription.should.be.a("object")
//                 done()
//             })
//       })
//     })
//   })
//
//   describe('/GET subscriptions/:subscriptionId', () => {
//     it('it should GET a subscription', (done) => {
//       let subscription = new Subscription(testSubscription)
//       subscription.save((err, subscription) => {
//         chai.request(server)
//             .get('/subscriptions/' + subscription._id)
//             .end((err, res) => {
//               res.should.have.status(201)
//               res.body.should.be.a("object")
//               done()
//             })
//       })
//     })
//   })
//
//   describe('/DELETE subscriptions/:subscriptionId', () => {
//     it('it should DELETE a subscription', (done) => {
//       let subscription = new Subscription(testSubscription)
//       subscription.save((err, subscription) => {
//         chai.request(server)
//             .delete('/subscriptions/' + subscription._id)
//             .end((err, res) => {
//                 res.should.have.status(201)
//                 res.body.should.have.property("message").eql("subscription successfully end dated")
//                 done()
//             })
//       })
//     })
//   })
// })
