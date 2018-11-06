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

describe('Validation', () => {
  let everyoneUser = null

  before((done) => {
    User.remove({})
    .then(() => {
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

  describe('POST validation/username/:username', () => {
    it('anyone can validate a username (valid)', (done) => {
      chai.request(server)
        .get('/validation/username/'+everyoneUser.username)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a("object")
          res.body.should.have.property("valid")
          res.body.valid.should.equal(true)
          done();
        });
    });
    it('anyone can validate a username (not valid)', (done) => {
      chai.request(server)
        .get('/validation/username/' + "invalidusername")
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a("object")
          res.body.should.have.property("valid")
          res.body.valid.should.equal(false)
          done();
        });
    });
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
