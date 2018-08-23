// //During the test the env variable is set to test
// process.env.NODE_ENV = 'test';
//
// let mongoose = require("mongoose");
// let User = require('../api/models/userModel');
//
// //Require the dev-dependencies
// let chai = require('chai');
// let chaiHttp = require('chai-http');
// let server = require('../server');
// let should = chai.should();
//
// chai.use(chaiHttp);
// //Our parent block
// describe('Users', () => {
//     beforeEach((done) => { //Before each test we empty the database
//         User.remove({}, (err) => {
//             done();
//         });
//     });
//     /*
//       * Test the /GET route
//       */
//     describe('/POST user', () => {
//         it('it should POST a new user', (done) => {
//             let newUser = {
//                 username: "Tester",
//                 password: "test123",
//                 email: "tester@ascendtrading.net"
//             };
//             chai.request(server)
//                 .post('/users')
//                 .send(newUser)
//                 .end((err, res) => {
//                     res.should.have.status(201);
//                     res.body.should.be.a("object");
//                     res.body.should.have.property("username").eql("Tester");
//                     res.body.should.have.property("_id");
//                     res.body.should.have.property("created_date");
//                     res.body.should.have.property("roles");
//                     res.body.roles.should.be.a("array");
//                     done();
//                 });
//         });
//     });
//
//     /*
//   * Test the /GET route
//   */
//     describe('/POST user', () => {
//         it('it should POST an invalid new user', (done) => {
//             let newUser = {
//                 username: "Tester"
//             };
//             chai.request(server)
//                 .post('/users')
//                 .send(newUser)
//                 .end((err, res) => {
//                     res.should.have.status(400);
//                     res.body.should.be.a("object");
//                     res.body.should.have.property("err").eql("Must provide username, password, and email");
//                     done();
//                 });
//         });
//     });
//
//     describe('/POST login', () => {
//         it('it should POST invalid login credentials and get 401', (done) => {
//             let newUser = {
//                 username: "NotAUser",
//                 password: "wrongpassword"
//             };
//             chai.request(server)
//                 .post('/login')
//                 .send(newUser)
//                 .end((err, res) => {
//                     res.should.have.status(401);
//                     res.body.should.be.a("object");
//                     done();
//                 });
//         });
//     });
//
//     describe('/POST login', () => {
//         it('it should POST login credentials', (done) => {
//             let user = new User({username: "Tester", password: "test123"});
//             user.save((err, user) => {
//                 user_credentials = {
//                     username: "Tester",
//                     password: "test123"
//                 };
//                 chai.request(server)
//                     .post('/login')
//                     .send(user_credentials)
//                     .end((err, res) => {
//                         res.should.have.status(201);
//                         res.body.should.be.a("object");
//                         res.body.should.have.property("token");
//                         done();
//                     });
//             });
//
//         });
//     });
//
//     describe('/GET user', () => {
//         it('it should GET a user', (done) => {
//             done();
//         });
//     });
// });
