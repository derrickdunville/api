# ascend-api
Ascend Trading Node API - Nodejs, Mongo, SocketIO

## About
This is the Ascend Trading API. It is a JSON API backend for the Ascend Trading application.

## Technologies
nodejs
mongodb
passport
SocketIO
Heroku
accesscontrol

## MongoDB
To connect to mongodb on a local environment you will need to have a mongodb server running and you'll
need to set your MONGODB_URI environment variable.

For Development
```
SET MONGODB_URI=mongodb://localhost/ascend_trading
```

For Heroku
```
SET MONGODB_URI=mongodb://ascend_root:4sc3ndR00t@ds151048.mlab.com:51048/heroku_c41mdm0l
```

## Dropping and Recreating MongoDB
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

## AccessControl API Docs
```
http://onury.github.io/accesscontrol/?api=ac
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

Dev Branch
