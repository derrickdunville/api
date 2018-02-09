'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    waterfall = require('async-waterfall'),
    crypto    = require('crypto')


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const btoa = require('btoa');
const { catchAsync } = require('../utils');
const redirect = encodeURIComponent('https://b8832d97.ngrok.io/oauth/discord/callback');
const fetch = require('node-fetch');

exports.createOAuthState = function(req, res) {
  waterfall([
    function(done){
      crypto.randomBytes(20, function(err, buf) {
        let state = buf.toString('hex');
        done(err, state)
      });
    },
    function(state, done){
      console.log("Req Body:" + req.body)
      if(req.body.token === null){
        res.status(401).send({err: "Please provide API token"});
      }
      User.findOne({token: req.body.token}, function(err, user){
        if(err || user === null){
          res.status(401).send({err: "Invalid Token - Error: " + err});
        } else {
          console.log("Setting password auth token..." + user._id + state);
          user.discordOAuthToken = user._id + state;
          user.discordOAuthExpires = Date.now() + 3600000 // 1 hour
          user.save(function(err){
            res.status(201).send({oauth_state: user._id + state});
          });
        }
      })
    }
  ],
  function(err){
    if (err) {
      res.status(401).send(err);
    }
  });
}

exports.discordCallback = catchAsync(async (req, res) => {

  if (!req.query.code) throw new Error('NoCodeProvided')
  // console.log(CLIENT_ID)
  const code = req.query.code
  const state = req.query.state
  console.log("Code: " + code)
  console.log("State: " + state)
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
  const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
      },
    })
  const json = await response.json()
  console.log(json)

  const discord_access_token = json.access_token

  const access_response = await fetch(`http://discordapp.com/api/users/@me`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${discord_access_token}`,
      },
    })
  // console.log(access_response)
  const access_json = await access_response.json()
  
  User.findOne({discordOAuthToken: state}, function(err, user){
    if(err || user === null){
      res.status(401).send({err: "Invalid State - Error: " + err})
    } else {
      // Get identity from discord

      console.log(access_json)
      user.discordOAuthToken = null
      user.discordOAuthExpires = null // 1 hour
      user.discordAccessToken = json.access_token
      user.discordAccessTokenExpires = Date.now() + (json.expires_in * 1000)
      user.discordRefreshToken = json.refresh_token
      user.discordUsername = access_json.username
      user.discordDiscriminator = access_json.discriminator
      user.discordId = access_json.id

      user.save(function(err){
        res.redirect(`http://localhost:8080/ascend`);
        // res.status(201).send({oauth_state: user._id + state})
      })
    }
  })
})