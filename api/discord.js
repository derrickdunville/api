const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const btoa = require('btoa');
const { catchAsync } = require('./utils');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent('https://6b9daafb.ngrok.io/api/discord/callback');

router.get('/login', (req, res) => {
  console.log(CLIENT_ID);
  const discord_oauth_url = `https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`
  console.log(discord_oauth_url);
  res.redirect(discord_oauth_url);
});

router.get('/callback', catchAsync(async (req, res) => {
  if (!req.query.code) throw new Error('NoCodeProvided');
  console.log(CLIENT_ID);
  console.log(req);
  const code = req.query.code;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
      },
    });
  const json = await response.json();
  res.redirect(`/?token=${json.access_token}`);
}));

module.exports = router;
