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
    it('user can login with token', (done) => {
      let creds = {
        token: everyoneUser.token
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
          done();
        });
    });
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
          done();
        });
    });
    it('user gets invalid or expired auth token err', (done) => {
      let creds = {
        token: everyoneUser.token //token was reset in previous test
      };
      chai.request(server)
        .post('/login')
        .send(creds)
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("invalid or expired auth token")
          done();
        });
    });
    it('user gets must provide username and password error', (done) => {
      let creds = {};
      chai.request(server)
        .post('/login')
        .send(creds)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You must provide the username and password")
          done();
        });
    });
    it('user gets username and password does not match error', (done) => {
      let creds = {
        username: everyoneUser.username,
        password: "wrong"
      };
      chai.request(server)
        .post('/login')
        .send(creds)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("username and password does not match")
          done();
        });
    });
  });
  describe('POST /forgot-password', () => {
    it('user can request password reset', (done) => {
      let body = {
        email: everyoneUser.email
      }
      chai.request(server)
        .post('/forgot-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("message").eql("Password reset email sent to " + everyoneUser.email)
          done();
        });
    });
    it('user gets must provide email error', (done) => {
      let body = {}
      chai.request(server)
        .post('/forgot-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message").eql("You must provide an email")
          done();
        });
    });
    it('user gets email address not found error', (done) => {
      let body = {
        email: "wrong@ascendtrading.net"
      }
      chai.request(server)
        .post('/forgot-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message").eql("email address not found")
          done();
        });
    });
  });
  describe('POST /reset-password', () => {
    it('user gets must provide password reset token and new password error (empty)', (done) => {
      let body = {};
      chai.request(server)
        .post('/reset-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("you must provide password reset token and new password")
          done();
        });
    });
    it('user gets must provide password reset token and new password error (no newPassword)', (done) => {
      let body = {
        resetToken: "wrong",
      };
      chai.request(server)
        .post('/reset-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("you must provide password reset token and new password")
          done();
        });
    });
    it('user gets must provide password reset token and new password error (no resetToken)', (done) => {
      let body = {
        newPassword: "wrong",
      };
      chai.request(server)
        .post('/reset-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("you must provide password reset token and new password")
          done();
        });
    });
    it('user gets invalid or expired password reset token (invalid)', (done) => {
      let body = {
        resetToken: "wrong",
        newPassword: "wrong",
      };
      chai.request(server)
        .post('/reset-password')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("invalid or expired password reset token")
          done();
        });
    });
    it('user gets invalid or expired password reset token (expired)', (done) => {
      let testUser = new User({
        email: 'tester2@ascendtrading.net',
        password: 'testerpw',
        username: 'tester2',
        passwordResetToken: 'expired',
        passwordResetExpires: Date.now() - 3700000 // older then 1 hr
      })
      testUser.save()
      .then(user => {
        let body = {
          resetToken: user.passwordResetToken,
          newPassword: "expiredpw",
        }
        chai.request(server)
          .post('/reset-password')
          .send(body)
          .end((err, res) => {
            res.should.have.status(400)
            res.body.should.have.property("err")
            res.body.err.should.have.property("message")
            res.body.err.message.should.equal("invalid or expired password reset token")
            done();
          });
      }).catch(err => {
        should.fail(0,1, err)
        done()
      })

    });
    it('user can reset password', (done) => {
      let testUser = new User({
        email: 'tester3@ascendtrading.net',
        password: 'testerpw',
        username: 'tester3',
        passwordResetToken: 'notexpired',
        passwordResetExpires: Date.now() + 3600000 // older then 1 hr
      })
      testUser.save()
      .then(user => {
        let body = {
          resetToken: user.passwordResetToken,
          newPassword: "expiredpw",
        }
        chai.request(server)
          .post('/reset-password')
          .send(body)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.have.property("message")
            res.body.message.should.equal("password successfully reset, email sent to " + testUser.email)
            done();
          });
      }).catch(err => {
        should.fail(0,1, err)
        done()
      })
    });
  });
  describe('POST /verify-password-reset-token', () => {
    it('user gets must provide reset token error (empty)', (done) => {
      let body = {}
      chai.request(server)
        .post('/verify-password-reset-token')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("must provide reset token")
          done();
        });
    });
    it('user gets must provide reset token error (null)', (done) => {
      let body = {
        resetToken: null
      }
      chai.request(server)
        .post('/verify-password-reset-token')
        .send(body)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("must provide reset token")
          done();
        });
    });
    it('user gets invalid reset token error', (done) => {
      let body = {
        resetToken: "wrong"
      }
      chai.request(server)
        .post('/verify-password-reset-token')
        .send(body)
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("invalid reset token")
          done();
        });
    });
    it('user gets exipred reset token error', (done) => {
      let testUser = new User({
        email: 'tester5@ascendtrading.net',
        password: 'testerpw',
        username: 'tester5',
        passwordResetToken: 'expired',
        passwordResetExpires: Date.now() - 3700000 // older then 1 hr
      })
      testUser.save()
      .then(user => {
        let body = {
          resetToken: user.passwordResetToken,
        }
        chai.request(server)
          .post('/verify-password-reset-token')
          .send(body)
          .end((err, res) => {
            res.should.have.status(401)
            res.body.should.have.property("err")
            res.body.err.should.have.property("message")
            res.body.err.message.should.equal("exipred reset token")
            done();
          });
      }).catch(err => {
        should.fail(0,1, err)
        done()
      })
    });
    it('user can verify password reset token', (done) => {
      let testUser = new User({
        email: 'tester4@ascendtrading.net',
        password: 'testerpw',
        username: 'tester4',
        passwordResetToken: 'notexpired',
        passwordResetExpires: Date.now() + 3600000 // older then 1 hr
      })
      testUser.save()
      .then(user => {
        let body = {
          resetToken: user.passwordResetToken,
        }
        chai.request(server)
          .post('/verify-password-reset-token')
          .send(body)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.have.property("message")
            res.body.message.should.equal("valid reset token")
            done();
          });
      }).catch(err => {
        should.fail(0,1, err)
        done()
      })
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
