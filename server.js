let express = require('express'),
    app = express(),
    morgan = require('morgan'),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    User = require('./api/models/userModel'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    cors = require('cors');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

// don't show the log when it is test
// if(config.util.getEnv('NODE_ENV') !== 'test') {
//     // use morgan to log requests to the console
//     app.use(morgan('combined'));
// }

// app.use(passport.initialize());
// app.use(passport.session());
// app.use(session(sessionOpts = {
//     saveUninitialized: true, // saved new sessions
//     resave: false, // do not automatically write to the session store
//     secret: 'secret',
//     cookie : { httpOnly: true, maxAge: 2419200000 } // configure when sessions expires
// }))
app.use(cors());

let userRoutes = require('./api/routes/userRoutes');
userRoutes(app);

app.use('/', express.static('public'));
app.use('/apidocs', express.static('apidoc'));

// catch 404 and forward to error handler
app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

app.use(function (err, req, res, next) {
    console.log(err.toString());
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('Invalid Token...')
    } else {
        res.status(500).send(err)
    }
});


let mongo = process.env.MONGODB_URI || 'localhost:27017/ascend_trading';
mongoose.Promise = require('bluebird');
mongoose.connect(mongo, function (err, res) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    console.log("Database connection ready");

    // Initialize the app.
    let server = app.listen(process.env.PORT || 3000, function () {
        let port = server.address().port;
        console.log("API now running on port", port);
    });
});

module.exports = app; // for testing
