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
          res.body.should.have.property("token")
          res.body.token.should.not.equal(null)
          res.body.should.have.property("stripe_cus_id")
          res.body.stripe_cus_id.should.not.equal(null)
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
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Must provide username, password, and email");
          done();
        });
    });
    it('anyone can be referred by another user', (done) => {

      let referringUser = new User({
        username: 'referringUser',
        password: 'referringuserpw',
        email: 'referringuser@ascendtrading.net'
      })
      referringUser.save()
      .then(user => {
        let newUser = {
            username: "referredUser",
            password: "testpw",
            email: "referreduser@ascendtrading.net",
            referred_by: 'referringUser'
        }
        chai.request(server)
          .post('/users')
          .send(newUser)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.a("object")
            res.body.should.have.property("username").eql("referredUser")
            res.body.should.have.property("_id")
            res.body.should.have.property("created_at")
            res.body.should.have.property("roles")
            res.body.roles.should.be.a("array")
            res.body.should.have.property('referred_by')
            done()
          });
      }).catch(err => {
        assert.fail(0, 1, 'Error creating referring user');
        done()
      })
    });
  });
  describe('GET /users', () => {
    it('everyone cant a list of users with no token', (done) => {
      chai.request(server)
        .get('/users')
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        });
    });
    it('everyone can get a list of users (filtered for everyone)', (done) => {
      chai.request(server)
        .get('/users')
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("docs")
          res.body.docs.should.be.a("array")
          res.body.should.have.property("total")
          res.body.total.should.be.a("number")
          res.body.total.should.equal(6)
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
            doc.should.have.property("username")
            doc.should.not.have.property("password")
            doc.should.not.have.property("email")
            doc.should.have.property("created_at")
            doc.should.not.have.property("token")
            doc.should.not.have.property("passwordResetToken")
            doc.should.not.have.property("passwordResetExpires")
            doc.should.not.have.property("discordOAuthToken")
            doc.should.not.have.property("discordOAuthExpires")
            doc.should.not.have.property("discordAccessToken")
            doc.should.not.have.property("discordAccessTokenExpires")
            doc.should.not.have.property("discordRefreshToken")
            doc.should.not.have.property("discordUsername")
            doc.should.not.have.property("discordDiscriminator")
            doc.should.not.have.property("discordId")
            doc.should.have.property("roles")
            doc.should.not.have.property("stripe_cus_id")
            doc.should.not.have.property("stripe_acct_id")
            doc.should.not.have.property("transactions")
            doc.should.not.have.property("subscriptions")
            doc.should.not.have.property("referred_by")
            doc.roles.should.be.a("array")
          }
          done()
        });
    });
    it('admin can get a list of users (filtered for admin)', (done) => {
      chai.request(server)
        .get('/users')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("docs")
          res.body.docs.should.be.a("array")
          res.body.should.have.property("total")
          res.body.total.should.be.a("number")
          res.body.total.should.equal(6)
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
            doc.should.have.property("username")
            doc.should.not.have.property("password")
            doc.should.have.property("email")
            doc.should.have.property("created_at")
            doc.should.not.have.property("token")
            doc.should.not.have.property("passwordResetToken")
            doc.should.not.have.property("passwordResetExpires")
            doc.should.not.have.property("discordOAuthToken")
            doc.should.not.have.property("discordOAuthExpires")
            doc.should.not.have.property("discordAccessToken")
            doc.should.not.have.property("discordAccessTokenExpires")
            doc.should.not.have.property("discordRefreshToken")
            doc.should.have.property("discordUsername")
            doc.should.have.property("discordDiscriminator")
            doc.should.have.property("discordId")
            doc.should.have.property("roles")
            doc.should.have.property("stripe_cus_id")
            doc.should.have.property("stripe_acct_id")
            doc.should.have.property("transactions")
            doc.should.have.property("subscriptions")
            doc.should.have.property("referred_by")
            doc.roles.should.be.a("array")
          }
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
    it('everyone can get any user (filtered for everyone)', (done) => {
      chai.request(server)
        .get('/users/' + everyoneUser2._id.toString())
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id").eql(everyoneUser2._id.toString())
          res.body.should.have.property("username").eql(everyoneUser2.username)
          res.body.should.not.have.property("password")
          res.body.should.not.have.property("email")
          res.body.should.have.property("created_at")
          res.body.should.not.have.property("token")
          res.body.should.not.have.property("passwordResetToken")
          res.body.should.not.have.property("passwordResetExpires")
          res.body.should.not.have.property("discordOAuthToken")
          res.body.should.not.have.property("discordOAuthExpires")
          res.body.should.not.have.property("discordAccessToken")
          res.body.should.not.have.property("discordAccessTokenExpires")
          res.body.should.not.have.property("discordRefreshToken")
          res.body.should.not.have.property("discordUsername")
          res.body.should.not.have.property("discordDiscriminator")
          res.body.should.not.have.property("discordId")
          res.body.should.have.property("roles").eql(everyoneUser2.roles)
          res.body.should.not.have.property("stripe_cus_id")
          res.body.should.not.have.property("stripe_acct_id")
          res.body.should.not.have.property("transactions")
          res.body.should.not.have.property("subscriptions")
          res.body.should.not.have.property("referred_by")
          res.body.roles.should.be.a("array")
          done()
        });
    })
    it('admin can get any user (filtered for admin)', (done) => {
      chai.request(server)
        .get('/users/' + everyoneUser._id.toString())
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id").eql(everyoneUser._id.toString())
          res.body.should.have.property("username").eql(everyoneUser.username)
          res.body.should.not.have.property("password")
          res.body.should.have.property("email")
          res.body.should.have.property("created_at")
          res.body.should.not.have.property("token")
          res.body.should.not.have.property("passwordResetToken")
          res.body.should.not.have.property("passwordResetExpires")
          res.body.should.not.have.property("discordOAuthToken")
          res.body.should.not.have.property("discordOAuthExpires")
          res.body.should.not.have.property("discordAccessToken")
          res.body.should.not.have.property("discordAccessTokenExpires")
          res.body.should.not.have.property("discordRefreshToken")
          res.body.should.have.property("discordUsername")
          res.body.should.have.property("discordDiscriminator")
          res.body.should.have.property("discordId")
          res.body.should.have.property("roles").eql(everyoneUser.roles)
          res.body.should.have.property("stripe_cus_id")
          res.body.should.have.property("stripe_acct_id")
          res.body.should.have.property("transactions")
          res.body.should.have.property("subscriptions")
          res.body.should.have.property("referred_by")
          res.body.roles.should.be.a("array")
          done()
        });
    });
  });
  describe('PUT /users/:userId', () => {
    it('everyone cant update any with no token', (done) => {
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
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        });
    })
    it('admin can update any user', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('user', JSON.stringify({username: "updatedUsername"}))
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id").eql(everyoneUser._id.toString())
          res.body.should.have.property("username")
          res.body.username.should.equal("updatedUsername")
          done()
        });
    })
    it('everyone cant update any user', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser2._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('user', JSON.stringify({username: "updatedUsername2"}))
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("You are not authorized to update users")
          done()
        });
    })
    it('everyone cant update own user unless password provided', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('user', JSON.stringify({username: "updatedOwnUsername"}))
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Must provide password")
          done()
        });
    })
    it('everyone cant update own user unless password provided is correct', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('user', JSON.stringify({username: "updatedOwnUsername", password: "wrong"}))
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Invalid password")
          done()
        });
    })
    it('everyone can update own user with correct password', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('user', JSON.stringify({username: "updatedOwnUsername", password: everyoneUser.password}))
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id").eql(everyoneUser._id.toString())
          res.body.should.have.property("username")
          res.body.username.should.equal("updatedOwnUsername")
          done()
        });
    })
    it('everyone can update own user with correct password (update avatar)', (done) => {
      chai.request(server)
        .put('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .field('user', JSON.stringify({password: everyoneUser.password}))
        .attach('avatar', fs.readFileSync(process.cwd() + '/test/profile1.png'), 'profile1.png')
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("_id").eql(everyoneUser._id.toString())
          res.body.should.have.property("username")
          res.body.username.should.equal("updatedOwnUsername")
          res.body.should.have.property("avatar")
          res.body.avatar.should.not.equal(null)
          res.body.avatar.should.be.a("object")
          res.body.avatar.should.have.property("_id")
          res.body.avatar.should.have.property("bucket")
          res.body.avatar.should.have.property("key")
          done()
        });
    })
  })
  describe('DELETE /users/:userId', () => {
    it('everyone cant delete any with no token', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser._id)
        .send()
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization Token not provided")
          done()
        });
    })
    it('admin can delete any user', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser._id)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          done()
        });
    })
    it('everyone cant delete any user', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser2._id)
        .set('Authorization', `Bearer ${everyoneUser.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(401)
          done()
        });
    })
    it('everyone can delete own user', (done) => {
      chai.request(server)
        .delete('/users/' + everyoneUser2._id)
        .set('Authorization', `Bearer ${everyoneUser2.token}`)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          done()
        });
    })
  })
  after((done) => {
    User.remove({})
    .then(() => {
      done()
    }).catch(err => {
      done()
    })
  });
});
