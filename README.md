# ascend-api
Ascend Trading Node API - Nodejs, Mongo, SocketIO

## About
This is the Ascend Trading API. It is a JSON API backend for the Ascend Trading application.

## Technologies
nodejs
mongodb
mongoose
SocketIO
Heroku
accesscontrol

## Docs
```
PRODUCTION: https://api.ascendtrading.net/apidocs
BETA: https://ascend-api.herokuapp.com/apidocs
LOCAL: http://localhost:3000/apidocs
```
## Environment Variables
For APLHA(Local):
```
API_PORT=3000
API_BASE_URL=http://localhost:3000/
MONGODB_URI=mongodb://localhost/ascend_trading
DISCORD_CLIENT_ID=406318468703584266
DISCORD_CLIENT_SECRET=Nu7ZKYZOijTlsdd6fZS1Iz3KGBBI8Vrk
DISCORD_CALLBACK=https://<NGROK_BASE>.ngrok.io/oauth/discord/callback
REDIRECT_URI=http://localhost:8080/
STRIPE_PUBLIC_KEY=
STRIPE_PRIVATE_KEY=
```
For BETA(Heroku):
```
API_PORT=3000
API_BASE_URL=https://ascend-api.herokuapp.com/
MONGODB_URI=mongodb://ascend_root:<PASSWORD>@ds151048.mlab.com:51048/heroku_c41mdm0l
DISCORD_CLIENT_ID=406318468703584266
DISCORD_CLIENT_SECRET=Nu7ZKYZOijTlsdd6fZS1Iz3KGBBI8Vrk
DISCORD_CALLBACK=https://ascend-api.herokuapp.com/oauth/discord/callback
REDIRECT_URI=https://ascend-react.herokuapp.com/
```
For PRODUCTION:
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

## MongoDB
To connect to mongodb on a local environment you will need to have a mongodb server running and you'll
need to set your MONGODB_URI environment variable.

### Dropping and Recreating MongoDB
```
mongo //to start the mongodb shell
show dbs //to list existing databases
use <dbname> //the <dbname> is the database you'd like to drop
db //should show <dbname> just to be sure I'm working with the right database
db.dropDatabase() //will delete the database & return { "dropped" : "<dbname>", "ok" : 1 }
use ascend_trading
```

### Ubuntu
```
Step 1: Remove lock file.
sudo rm /var/lib/mongodb/mongod.lock

Step 2: Repair mongodb.
sudo mongod --repair

Step 3: start mongodb.
sudo start mongod
or
sudo service mongod start

Step 4: Check status of mongodb.
sudo status mongod
or   
sudo service mongod status

Step 5: Start mongo console.
mongo
```

## Helpful Docs
### AccessControl
```
http://onury.github.io/accesscontrol/?api=ac
```
### Mongoose
```
http://mongoosejs.com/docs/4.x/docs/guide.html
```
### Stripe
```
https://stripe.com/docs
```
### Discord
```
https://discordapp.com/developers/docs/intro
```

## Heroku
Heroku is setup with automated deployments for the master branch.

## Start the API
Start the mongodb server
```C:\Program Files\MongoDB\Server\3.4\bin>mongod.exe```

Start the node server
```node server.js or nmp start```

## Testing the API
Run the mocha & chai test scripts
```npm test```
