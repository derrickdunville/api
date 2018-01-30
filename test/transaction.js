// //During the test the env variable is set to test
// process.env.NODE_ENV = 'test'
//
// let mongoose = require("mongoose")
// let Transaction = require('../api/models/transactionModel')
//
// //Require the dev-dependencies
// let chai = require('chai')
// let chaiHttp = require('chai-http')
// let server = require('../server')
// let should = chai.should()
//
// chai.use(chaiHttp)
// //Our parent block
// describe('Transaction', () => {
//
//   let now = new Date()
//   let testDate = new Date()
//   testDate.setYear(now.getYear() + 1)
//   let testTransaction = {
//     amount: 99.99,
//     total: 99.99,
//     tax_amount: 0.00,
//     tax_rate: 0.00,
//     tax_desc: "n/a",
//     tax_compound: false,
//     tax_shipping: false,
//     tax_class: "standard",
//     // user_id: "need to create a user",
//     // product_id: "need to create a product"
//     trans_num: "testtxnnumber",
//     status: "pending",
//     txn_type: "payment",
//     response: "test response",
//     gateway: "manual",
//     subscription_id: "testsubid",
//     ip_address: "127.0.0.1",
//     prorated: false,
//     expires_at: testDate
//   }
//
//   beforeEach((done) => { //Before each test we empty the database
//       Transaction.remove({}, (err) => {
//           done();
//       })
//   })
//
//   describe('/POST transactions', () => {
//     it('it should POST a new transaction', (done) => {
//       chai.request(server)
//           .post('/transactions')
//           .send(testTransaction)
//           .end((err, res) => {
//               res.should.have.status(201)
//               res.body.should.be.a("object")
//               done()
//           })
//     })
//   })
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
