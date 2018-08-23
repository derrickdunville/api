'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    waterfall = require('async-waterfall'),
    crypto    = require('crypto'),
    config    = require('../config')


const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_CALLBACK = process.env.DISCORD_CALLBACK;
const REDIRECT_URI = process.env.REDIRECT_URI;
const btoa = require('btoa');
const { catchAsync } = require('../utils');
const redirect = encodeURIComponent(DISCORD_CALLBACK);
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
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
        req.app.io.sockets.emit('auth-updated', '')
        res.redirect(REDIRECT_URI);
        // res.status(201).send({oauth_state: user._id + state})
      })
    }
  })
})

exports.revokeOAuth = catchAsync(async (req, res) => {
  console.log("Req Body:" + req.body)
  let discordTokenToRekove
  if(req.body.token === null){
    res.status(401).send({err: "Please provide API token"})
  }
  User.findOne({token: req.body.token}, function(err, user){
    if(err || user === null){
      res.status(401).send({err: "Invalid Token - Error: " + err})
    } else {
      let discordTokenToRekove = user.discordAccessToken
      user.discordOAuthToken = null
      user.discordOAuthExpires = null
      user.discordUsername = null
      user.discordDiscriminator = null
      user.discordAccessToken = null
      user.discordAccessTokenExpires = null
      user.discordRefreshToken = null
      user.discordId = null
      user.save(function(err){
      })
    }
  })

  const response = await fetch(`https://discordapp.com/api/oauth2/token/revoke?token=${discordTokenToRekove}`,
    {
      method: 'POST',
    })
  if(response.status === 200){
    console.log("Successfully revoked Discord OAuth")
    User.findOne({token: req.body.token}, function(err, user){
      if(err || user === null){
        res.status(401).send({err: "Invalid Token - Error: " + err})
      } else {
        res.status(200).send({user: user, msg: "Successfully revoked Discord OAuth"})
      }
    })
  } else {
    const json = await response.json()
    res.status(401).send({err: json.error_description})
  }
})

exports.joinDiscordGuild = function(req, res) {

  User.findOne({_id: req.user._id}).exec().then(user => {
    let roles = user.getDiscordRoles()
    roles.then(roles => {
      console.dir("roles:", roles)
      const current_date = new Date()
      if(req.user.discordAccessToken == null || req.user.discordAccessTokenExpires.getTime() < current_date.getTime()){
        res.status(401).send({err: "Invalid Token - Error" })
      } else {
        // Derive the users discord role from their transactions
        // We need to
        // select the discord role ids of where product.category are 'memberhip'
        // where transaction.expiration_date is in the future.


        // DISCORD API CALL - adding the user to the guild
        const response = fetch(`https://discordapp.com/api/guilds/${config.discord_guild_id}/members/${req.user.discordId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              access_token: req.user.discordAccessToken,
              roles: roles
            })
          })
        response.then(response => {
          if(response.status === 201){
            console.log("Successfully Added "+ req.user.username +"/"+req.user.discordUsername+"#"+req.user.discordDiscriminator+" to Guild")
            const discord_guild_member = response.json()
            discord_guild_member.then(json => {
              res.status(201).send({ discord_guild_member: json})
            })
          } else if(response.status === 204){
            console.log(req.user.username +"/"+req.user.discordUsername+"#"+req.user.discordDiscriminator+" is already in the Guild")
            // 204 comes back when the user is already in the guild
            // so get just get the guild member and return it as if they joined successfully
            res.status(201).send({})
          } else {
            const json = response.json()
            json.then(json => {
              console.log("Something went wrong trying to join the discord guild...")
              console.dir(json)
              res.status(401).send({err: "Something went wrong trying to join the discord guild"})
            })
          }
        })
      }
    }).catch(err => {
      console.log("error occurred getting discord roles", err)
      res.status(401).send({err: "error occurred getting discord roles"})
    })
  }).catch(err => {
    console.log("error occurred getting user", err)
    res.status(401).send({err: "error occurred getting user"})
  })
}
