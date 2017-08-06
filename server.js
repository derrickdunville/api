var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    User = require('./api/models/userModel'),
    bodyParser = require('body-parser'),
    session = require('client-sessions');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://ascendroot:4sc3ndR00t@ds151048.mlab.com:51048/heroku_c41mdm0l');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    cookieName: 'session',
    secret: 'ascend_trading_session', //TODO: make this stronger
    duration: 30*60*1000,
    activateDuration: 5*60*1000,
}));

var routes = require('./api/routes/userRoutes');
routes(app);

app.use('/', express.static('public'));
app.use('/apidocs', express.static('apidoc'));
app.listen(port);

// Session middleware
app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        User.findOne({ username: req.session.user.username }, function(err, user) {
            if (user) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user;  //refresh the session value
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
});

console.log('User RESTful API server started on: ' + port);
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
