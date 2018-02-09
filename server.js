let express = require('express'),
    app = express(),
    morgan = require('morgan'),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    // LocalStrategy = require('passport-local').Strategy,
    cors = require('cors'),

    //Mongoose Models
    User = require('./api/models/userModel'),
    Product = require('./api/models/productModel'),
    Transaction = require('./api/models/transactionModel'),
    Subscription = require('./api/models/subscriptionModel'),

    //Routes
    userRoutes = require('./api/routes/userRoutes'),
    productRoutes = require('./api/routes/productRoutes'),
    subscriptionRoutes = require('./api/routes/subscriptionRoutes'),
    transactionRoutes = require('./api/routes/transactionRoutes'),
    oauthRoutes = require('./api/routes/oauthRoutes');


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization')
    next()
})

app.use(cors())

userRoutes(app)
productRoutes(app)
subscriptionRoutes(app)
transactionRoutes(app)
oauthRoutes(app)

app.use('/', express.static('public'))
app.use('/apidocs', express.static('apidoc'))

// catch 404 and forward to error handler
app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
})

// app.use(function (err, req, res, next) {
//     console.log(err.toString())
//     if (err.name === 'UnauthorizedError') {
//         res.status(401).send('Invalid Token...')
//     } else {
//         res.status(500).send(err)
//     }
// })


let mongo = process.env.MONGODB_URI || 'localhost:27017/ascend_trading'
mongoose.Promise = require('bluebird')
mongoose.connect(mongo, function (err, res) {
    if (err) {
        console.log(err)
        process.exit(1)
    }

    // Save database object from the callback for reuse.
    console.log("Database connection ready")

    // Initialize the app.
    let server = app.listen(process.env.PORT || 3000, function () {
        let port = server.address().port
        console.log("API now running on port", port)
    })
})


module.exports = app // for testing
