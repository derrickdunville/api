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

## MongoDB
To connect to mongodb on a local environment you will need to have a mongodb server running and you'll
need to set your MONGODB_URI environment variable.
For Development
```SET MONGODB_URI=mongodb://localhost/ascend_trading```
For Heroku
```SET MONGODB_URI=mongodb://ascendroot:4sc3ndR00t@ds151048.mlab.com:51048/heroku_c41mdm0l```

##Heroku
Heroku is setup with automated deployments for the master branch