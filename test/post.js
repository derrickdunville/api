//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
let mongoose = require("mongoose");
let User = require('../api/models/userModel');
let Post = require('../api/models/postModel');
//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let fs = require("fs");
let server = require('../server');
let should = chai.should();
let path = require('path')

chai.use(chaiHttp);

describe('Posts', () => {
  let adminUser = null
  let everyoneUser = null
  let everyoneUser2 = null

  let testPost = {
    user: everyoneUser,
    content: "this is a test post"
  }
  before((done) => {
    User.remove({})
    .then(() => {
      // test admin user
      let testAdminUser = new User({
        email: 'admin@tester.net',
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
        email: 'everyoneuser@tester.net',
        password: 'testerpw',
        username: 'everyoneuser',
        roles: ["everyone"],
        token: 'testeveryonetoken'
      })
      return testEveryoneUser.save()
    })
    .then(user => {
      everyoneUser = user
      // console.log("EveryoneUser: ")
      // console.dir(JSON.parse(JSON.stringify(everyoneUser)))
      testPost.user = JSON.parse(JSON.stringify(everyoneUser))
      let testEveryoneUser2 = new User({
        email: 'everyoneuser2@tester.net',
        password: 'testerpw',
        username: 'everyoneuser2',
        roles: ["everyone"],
        token: 'testeveryonetoken2'
      })
      return testEveryoneUser2.save()
    })
    .then(user => {
      everyoneUser2 = user
      done()
    }).catch(err => {
      // console.error(err)
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
          // // console.log("Cookie", cookies)
          done();
        });
    });
  });

  // Now that we have a logged in user we can successfully test posts routes
  describe('POST /posts', () => {
    it('everyone cant create a new post without cookie', (done) => {
      chai.request(server)
        .post('/posts')
        .send(testPost)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.should.be.a("object")
          res.body.should.have.property("err")
          res.body.err.should.have.property("message")
          res.body.err.message.should.equal("Authorization not provided")
          done()
        });
    })
    it('everyone can create a post with cookie', (done) => {
      chai.request(server)
        .post('/posts')
        .send(testPost)
        .set('cookie', cookies)
        .end((err, res) => {
          // console.dir(res.body)
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("user")
          res.body.user.should.be.a("object")
          res.body.user.should.have.property("_id")
          res.body.should.have.property("_id")
          res.body.user._id.should.equal(testPost.user._id)
          res.body.should.have.property("created_at")
          res.body.should.have.property("content")
          res.body.content.should.equal(testPost.content)
          // make sure we save the successful test post so we can use in future tests
          testPost = res.body
          done();
        })
    })
  });
  describe('GET /posts', () => {
    it('everyone cant get a list of posts with no cookie', (done) => {
      chai.request(server)
        .get('/posts')
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
    it('everyone can get a list of posts with cookie', (done) => {
      chai.request(server)
        .get('/posts')
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          // TODO: make this a bit more strict of a test
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("total")
          res.body.should.have.property("pages")
          res.body.should.have.property("page")
          res.body.should.have.property("docs")
          res.body.docs.should.be.a("array")
          done()
        });
    });
  });
  describe('GET /posts/:id', () => {
    it('everyone cant get any post with no token', (done) => {
      chai.request(server)
        .get('/posts/' + testPost._id)
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
    it('everyone can get any post with cookie', (done) => {
      chai.request(server)
        .get('/posts/' + testPost._id)
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("user")
          res.body.user._id.should.equal(testPost.user._id)
          res.body.should.have.property("content")
          res.body.content.should.be.a("string")
          res.body.content.should.be.equal(testPost.content)
          res.body.should.have.property("created_at")
          res.body.created_at.should.equal(testPost.created_at)
          done()
        });
    });
  });
  describe('PUT /posts/:id', () => {
    it('everyone cant update any post with no token', (done) => {
      chai.request(server)
        .put('/posts/' + testPost._id)
        .send({
          content: "updated content"
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
    it('everyone can update own post with cookie', (done) => {
      chai.request(server)
        .put('/posts/' + testPost._id)
        .set('cookie', cookies)
        .send({
          content: "updated content"
        })
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a("object")
          res.body.should.have.property("content")
          res.body.content.should.equal("updated content")
          done()
        });
    });
  });
  describe('DELETE /posts/:id', () => {
    it('everyone cant delete a post with no cookie', (done) => {
      chai.request(server)
        .delete('/posts/' + testPost._id)
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
    it('everyone can delete own post with cookie', (done) => {
      chai.request(server)
        .delete('/posts/' + testPost._id)
        .set('cookie', cookies)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a("object")
          res.body.should.have.property("message")
          res.body.message.should.equal("post successfully deleted")
          done()
        });
    })
  });
  after((done) => {
    User.remove({})
    .then(() => {
      return Post.remove({})
    }).then(() => {
      done()
    }).catch(err => {
      done()
    })
  });
});
