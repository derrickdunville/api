let express = require('express'),
    app = express(),
    morgan = require('morgan'),
    // API_BASE_URL = process.env.API_BASE_URL || 'http://localhost',
    API_BASE_URL = 'http://localhost',
    PORT = 3001,
    // MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/api',
    MONGODB_URI = 'mongodb://localhost/api',
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser')
    formidable = require('express-formidable')
    cors = require('cors'),

    //Mongoose Models
    User = require('./api/models/userModel'),
    //Routes
    userRoutes = require('./api/routes/userRoutes'),


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())
// app.use(formidable())
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization')
    next()
})
app.use(cors())

userRoutes(app)

app.use('/', express.static('apidoc'))
// catch 404 and forward to error handler
app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
})

// mongoose.Promise = require('bluebird')
mongoose.connect(MONGODB_URI, function (err, res) {
    if (err) {
        console.log(err)
        process.exit(1)
    }
    // Save database object from the callback for reuse.
    console.log("Database connection ready")
    // Initialize the app.
    const server = app.listen(PORT, function () {
        let port = server.address().port
        console.log("API NOW RUNNING ON PORT: ", port)
        console.log("API_BASE_URL: ", API_BASE_URL)
        console.log("MONGODB_URI: ", MONGODB_URI)
    })
})

module.exports = app // for testing
