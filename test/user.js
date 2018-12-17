//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
let User = require('../api/models/userModel');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let fs = require("fs");
let server = require('../server');
let should = chai.should();
let path = require('path')

chai.use(chaiHttp);

describe('Users', () => {
  let adminUser = null
  let everyoneUser = null
  let everyoneUser2 = null

  before((done) => {
    User.remove({})
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
      let testEveryoneUser = new User({
        email: 'everyoneuser2@ascendtrading.net',
        password: 'testerpw',
        username: 'everyoneuser2',
        token: 'testeveryonetoken2'
      })
      return testEveryoneUser.save()
    })
    .then(user => {
      everyoneUser2 = user
      done()
    }).catch(err => {
      done()
    })
  });

  // We will run this here so we can get authorized to view the protected routes
  var cookies
  describe('POST /login', () => {
    it('user can login with username/password', (done) => {
      let creds = {
          username: everyoneUser.username,
          password: everyoneUser.password
      };
      chai.request(server)
        .post('/login')
        .send(creds)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("username").eql(everyoneUser.username)
          res.body.should.have.property("_id").eql(everyoneUser._id.toString())
          res.body.should.have.property("created_at")
          res.body.should.have.property("roles").eql(everyoneUser.roles)
          res.body.roles.should.be.a("array")
          res.body.should.have.property("token")
          res.body.token.should.not.equal(null)
          res.headers.should.have.property('set-cookie')
          cookies = res.headers['set-cookie'].pop().split(';')[0]
          // console.log("Cookie", cookies)
          done();
        });
    });
  });
  describe('POST /users', () => {
    it('anyone can create a new user', (done) => {
      let newUser = {
          username: "testuser",
          password: "testpw",
          email: "testuser@ascendtrading.net"
      };
      chai.request(server)
        .post('/users')
        .send(newUser)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("username").eql("testuser")
          res.body.should.have.property("_id")
          res.body.should.have.property("created_at")
          res.body.should.have.property("roles")
          res.body.roles.should.be.a("array")
          done();
        });
    });
    it('anyone gets must provide username, password, and email error', (done) => {
      let newUser = {
          username: "Tester"
      };
      chai.request(server)
        .post('/users')
        .send(newUser)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a("object");
          res.body.should.have.property("message")
          res.body.message.should.equal("Must provide username, password, and email");
          done();
        });
    });
  });
  describe('GET /users', () => {
    it('everyone cant get a list of users with no cookie', (done) => {
      chai.request(server)
        .get('/users')
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization not provided")
          done()
        });
    });
    it('everyone can get a list of users with cookie', (done) => {
      chai.request(server)
        .get('/users')
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          done()
        });
    });
  });
  describe('GET /users/:userId', () => {
    it('everyone cant get any user with no token', (done) => {
      chai.request(server)
        .get('/users/' + everyoneUser.username)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          done()
        });
    });
    it('everyone can get any user with cookie', (done) => {
      chai.request(server)
        .get('/users/' + everyoneUser.username)
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          done()
        });
    });
  });
  describe('PUT /users/:userId', () => {
    it('everyone can update any with no token', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .send({
          username: "updatedUsername"
        })
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization not provided")
          done()
        });
    })
    it('everyone can update any user with cookie', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser.username)
        .set('cookie', cookies)
        .send({
          username: "updatedUsername"
        })
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          done()
        });
    });
  });
  describe('DELETE /users/:userId', () => {
    it('everyone cant delete with no cookie', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser._id)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization not provided")
          done()
        });
    })
    it('everyone can delete any user with cookie', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser.username)
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a("object")
          done()
        });
    })
  });
  after((done) => {
    User.remove({})
    .then(() => {
      done()
    }).catch(err => {
      done()
    })
  });
});
