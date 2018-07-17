let express = require('express'),
    app = express(),
    morgan = require('morgan'),
    API_BASE_URL = process.env.API_BASE_URL || 'http://localhost',
    PORT = process.env.PORT || 3000,
    MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/ascend_trading',
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    formidable = require('express-formidable')
    // LocalStrategy = require('passport-local').Strategy,
    cors = require('cors'),

    //Mongoose Models
    User = require('./api/models/userModel'),
    Commission = require('./api/models/commissionModel'),
    Transaction = require('./api/models/transactionModel'),
    Product = require('./api/models/productModel'),
    Subscription = require('./api/models/subscriptionModel'),
    Click = require('./api/models/clickModel'),
    Image = require('./api/models/imageModel'),


    //Routes
    meRoutes = require('./api/routes/meRoutes'),
    validationRoutes = require('./api/routes/validationRoutes'),
    userRoutes = require('./api/routes/userRoutes'),
    productRoutes = require('./api/routes/productRoutes'),
    subscriptionRoutes = require('./api/routes/subscriptionRoutes'),
    transactionRoutes = require('./api/routes/transactionRoutes'),
    commissionRoutes = require('./api/routes/commissionRoutes'),
    clickRoutes = require('./api/routes/clickRoutes'),
    oauthRoutes = require('./api/routes/oauthRoutes'),
    stripeRoutes = require('./api/routes/stripeRoutes'),
    socketRoutes = require('./api/routes/socketRoutes'),
    SocketIo = require('socket.io')


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// app.use(formidable())
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization')
    next()
})
app.use(cors())

meRoutes(app)
validationRoutes(app)
userRoutes(app)
productRoutes(app)
subscriptionRoutes(app)
transactionRoutes(app)
commissionRoutes(app)
clickRoutes(app)
oauthRoutes(app)
stripeRoutes(app)
socketRoutes(app)

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
        console.log("API now running on port", port)
    })

    const io = new SocketIo(server, {path: '/ws'})
    const socketEvents = require('./api/socketEvents')(io);

    app.io = io // Allows us to access io in the controllers
})

module.exports = app // for testing
