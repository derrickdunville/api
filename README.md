# ascend-api
Ascend Trading Node API - Nodejs, Mongo, SocketIO

## About
This is the Ascend Trading API. It is a JSON API backend for the Ascend Trading application.

## Technologies
nodejs, mongodb, mongoose, accesscontrol, SocketIO, Heroku, apidocs

## API Docs
[PRODUCTION](https://api.ascendtrading.net/apidocs)

[BETA](https://ascend-api.herokuapp.com/apidocs)

[LOCAL](http://localhost:3000/apidocs)

## Helpful Docs
[AccessControl](http://onury.github.io/accesscontrol/?api=ac)

[Mongoose](http://mongoosejs.com/docs/4.x/docs/guide.html)

[Stripe](https://stripe.com/docs)

[Discord](https://discordapp.com/developers/docs/intro)

[SocketIO](https://socket.io/docs/)

[APIDOCS](http://apidocjs.com/)

## Environment Variables
### APLHA (Local):
```
export API_PORT=3000
export API_BASE_URL=http://localhost:3000/
export MONGODB_URI=mongodb://localhost/ascend_trading
export DISCORD_CLIENT_ID=406318468703584266
export DISCORD_CLIENT_SECRET=Nu7ZKYZOijTlsdd6fZS1Iz3KGBBI8Vrk
export DISCORD_CALLBACK=https://ascendtrading.ngrok.io/oauth/discord/callback
export REDIRECT_URI=http://localhost:8080/account/connections
export STRIPE_PUBLISHABLE_KEY=pk_test_1u5ImR375vh3iwVcWfdaPtJk
export STRIPE_PRIVATE_KEY=sk_test_K3Ol21vL7fiVAUDcp8MnOAYT
```
### BETA (Heroku):
```
API_PORT=3000
API_BASE_URL=https://ascend-api.herokuapp.com/
MONGODB_URI=mongodb://ascend_root:<PASSWORD>@ds151048.mlab.com:51048/heroku_c41mdm0l
DISCORD_CLIENT_ID=406318468703584266
DISCORD_CLIENT_SECRET=Nu7ZKYZOijTlsdd6fZS1Iz3KGBBI8Vrk
DISCORD_CALLBACK=https://ascend-api.herokuapp.com/oauth/discord/callback
REDIRECT_URI=https://ascend-react.herokuapp.com/
```
### PRODUCTION:
```
API_PORT=3000
API_BASE_URL=http://api.ascendtrading.net/
MONGODB_URI=mongodb://ascend_root:<PASSWORD>@ds151048.mlab.com:51048/heroku_c41mdm0l
DISCORD_CLIENT_ID=406318468703584266
DISCORD_CLIENT_SECRET=<SECRET>
DISCORD_CALLBACK=http://api.ascendtrading.net/oauth/discord/callback
REDIRECT_URI=http://www.ascendtrading.net/
STRIPE_PUBLIC_KEY=
STRIPE_PRIVATE_KEY=<SECRET>
```

## Stripe
In order to connect this backend API to Stripe, you will need to create a webhook
in the Stripe Admin Dashboard that points to:
```
<API_BASE_URL>/stripe
```
You can open an ngrok tunnel to this server for Local Development

## Discord
In order to connect this backend API to Discord OAuth, you will need to create a
redirect uri in the Discord Admin Dashboard
```
<API_BASE_URL>/oauth/discord/callback
```
You can open an ngrok tunnel to this server for Local Development

## MongoDB
To connect to mongodb on a local environment you will need to have a mongodb server running and you'll need to set your MONGODB_URI environment variable.
### Dropping and Recreating MongoDB
```
mongo             //to start the mongodb shell
show dbs          //to list existing databases
use <dbname>      //the <dbname> is the database you'd like to drop
db                //should show <dbname> just to be sure I'm working with the right database
db.dropDatabase() //will delete the database & return { "dropped" : "<dbname>", "ok" : 1 }
use ascend_trading
```
### Mongo Lock Issues - Ubuntu
```
sudo rm /var/lib/mongodb/mongod.lock  //1. Remove lock file.
sudo mongod --repair                  //2. Repair mongodb
sudo start mongod                     //3. start mongodb.
sudo status mongod                    //4. Check status of mongodb.
mongo                                 //5. Start mongo console.
```

## ngrok
To run ngrok tunnel on ubuntu
```
$ ngrok http -subdomain=ascendtrading 3000
```
OAUTH methods require a webhook url. We tunnel webhooks using ngrok
`https://ascendtrading.ngrok.io/oauth/<app>/callback`
We save these URLs in environment vars.
https://ascendtrading.ngrok.io/stripe/callback

## Heroku
Heroku is setup with automated deployments for the master branch.

## AWS S3
S3 is used to handle file uploads and static assets for the application
S3 Bucket: ascendtrading
  folders: /avatars

## Start the API
Start the mongodb server
```
C:\Program Files\MongoDB\Server\3.4\bin>mongod.exe
```

Start the node server
```
node server.js or nmp start
```

## Testing the API
Run the mocha & chai test scripts
```
npm test
```
