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

var cookies;

describe('Auth', () => {
  let everyoneUser = null
  before((done) => {
    User.remove({})
    .then(() => {
      // test everyone user
      let testEveryoneUser = new User({
        email: 'tester@ascendtrading.net',
        password: 'testerpw',
        username: 'tester',
        token: 'testeveryonetoken',
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
          console.log("Cookie", cookies)
          done();
        });
    });
  });
  describe('GET /@me', () => {
    it('user can get their user object with correct cookie', (done) => {
      chai.request(server)
        .get('/@me')
        .set('cookie', cookies)
        .send()
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
          done();
        });
    });
  });
  describe('POST /logout', () => {
    it('user can logout with correct cookie', (done) => {
      chai.request(server)
        .post('/logout')
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          console.dir(res.body)
          res.should.have.status(201)
          res.body.should.be.a("object")
          done();
        });
    });
  });
    // it('user gets invalid or expired auth token err', (done) => {
    //   let creds = {
    //     token: everyoneUser.token //token was reset in previous test
    //   };
    //   chai.request(server)
    //     .post('/login')
    //     .send(creds)
    //     .end((err, res) => {
    //       res.should.have.status(401)
    //       res.body.should.be.a("object")
    //       res.body.should.have.property("err")
    //       res.body.err.should.have.property("message")
    //       res.body.err.message.should.equal("invalid or expired auth token")
    //       done();
    //     });
    // });
    // it('user gets must provide username and password error', (done) => {
    //   let creds = {};
    //   chai.request(server)
    //     .post('/login')
    //     .send(creds)
    //     .end((err, res) => {
    //       res.should.have.status(400)
    //       res.body.should.be.a("object")
    //       res.body.should.have.property("err")
    //       res.body.err.should.have.property("message")
    //       res.body.err.message.should.equal("You must provide the username and password")
    //       done();
    //     });
    // });
    // it('user gets username and password does not match error', (done) => {
    //   let creds = {
    //     username: everyoneUser.username,
    //     password: "wrong"
    //   };
    //   chai.request(server)
    //     .post('/login')
    //     .send(creds)
    //     .end((err, res) => {
    //       res.should.have.status(400)
    //       res.body.should.be.a("object")
    //       res.body.should.have.property("err")
    //       res.body.err.should.have.property("message")
    //       res.body.err.message.should.equal("username and password does not match")
    //       done();
    //     });
    // });
  after((done) => {
    User.remove({})
    .then(() => {
      done()
    }).catch(err => {
      done()
    })
  });
});
