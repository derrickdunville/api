var express = require('express'),
    app = express(),
    port = process.env.PORT || 3001,
    mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    User = require('./api/models/userModel'),
    bodyParser = require('body-parser'),
    session = require('express-session');
    passport = require('passport');
    LocalStrategy = require('passport-local').Strategy;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(session({
//     cookieName: 'session',
//     secret: 'ascend_trading_session', //TODO: make this stronger
//     duration: 30*60*1000,
//     activateDuration: 5*60*1000,
// }));

app.use(passport.initialize());
app.use(passport.session());
app.use(session(sessionOpts = {
    saveUninitialized: true, // saved new sessions
    resave: false, // do not automatically write to the session store
    secret: 'secret',
    cookie : { httpOnly: true, maxAge: 2419200000 } // configure when sessions expires
}))

var userRoutes = require('./api/routes/userRoutes');
//var routes = require('./api/routes/userRoutes');
userRoutes(app);

app.use('/', express.static('public'));
app.use('/apidocs', express.static('apidoc'));


// // Session middleware
// app.use(function(req, res, next) {
//     if (req.session && req.session.user) {
//         User.findOne({ username: req.session.user.username }, function(err, user) {
//             if (user) {
//                 req.user = user;
//                 delete req.user.password; // delete the password from the session
//                 req.session.user = user;  //refresh the session value
//             }
//             // finishing processing the middleware and run the route
//             next();
//         });
//     } else {
//         next();
//     }
// });

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


//mongoose.Promise = global.Promise;

console.log("MONGODB_URI: " + process.env.MONGODB_URI);
//mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
mongoose.connect(process.env.MONGODB_URI, function (err, res) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 3001, function () {
        var port = server.address().port;
        console.log("API now running on port", port);
    });
});

//mongoose.connect(process.env.MONGODB_URI);
//app.listen(3001);