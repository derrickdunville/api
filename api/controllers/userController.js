'use strict';
let mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    config  = require('../config'),
    _       = require('lodash'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    User    = mongoose.model('User'),
    AccessControl = require('accesscontrol');

// var accessList = [
//   //create user is unprotected
//   //{role: "admin", resource: "user", action: "create:any", attributes: ["*"]},
//   {role: "admin", resource: "user", action: "read:any", attributes: ["*", ]},
//   {role: "admin", resource: "user", action: "delete:any", attributes: ["*"]},
//   {role: "admin", resource: "user", action: "update:any", attributes: ["*", "!_id", "!password", "!createDate"]},
//
//   // create user is unprotected
//   //{role: "everyone", resource: "user", action: "create:any", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "read:own", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "delete:own", attributes: ["*"]},
//   {role: "everyone", resource: "user", action: "update:own", attributes: ["*", "!_id", "!createDate"]}
// ];

let grants = {
    admin: {
        user: {
            "read:any": ["*"],
            "delete:any": ["*"],
            "update:any": ["*"]
        }
    },
    everyone: {
        user: {
            "read:any": ['*', '!password', '!token', '!email'],
            "delete:own": ['*'],
            "update:own": ['*']
        }
    }
};

let ac = new AccessControl(grants);

exports.loginUser = function(req, res){
    // console.log('Logging in...');
    // console.log(req.body.username + ' ' + req.body.password);
    if (!req.body.username || !req.body.password) {
        // console.log("You must provide the username and password");
        res.status(400).send({err: "You must provide the username and password"});
    } else {
        //lookup user by username
        //password should come hashed from the client application
        // console.log("Looking up user...");
        User.findOne({username: req.body.username}, function(err, user) {
            if (err || user === null){
                // console.log('Login failed...');
                res.status(401).send(err);
            } else {
                // console.log(user);
                if(user.password !== req.body.password){
                    // console.log('Login failed..');
                    res.status(400).send({err: "username and password does not match"});
                } else {
                    // save the user on to the session
                    //req.session.user = user;
                    user.token = '';
                    user.save(function(err, empty_token_user){
                        // create the jwt and save it to the user
                        // user.token = jwt.sign(user, process.end.JWT_SECRET)
                        empty_token_user.token = jwt.sign(empty_token_user, 'ascendtradingapi');
                        empty_token_user.save(function(err,updated_user){
                            // console.log('Logged in...');
                            res.status(201).send(updated_user);
                        })
                    });
                }
            }
        });
    }
};

exports.listUsers = function(req, res) {
    // console.log("User Roles: " + req.user.roles);
    let permission = ac.can(req.user.roles).readAny('user');
    if(permission.granted){
        User.find({}, function(err, users) {
            if (err)
                res.status(401).send(err);
            // filter the result set
            let filteredUsers = permission.filter(JSON.parse(JSON.stringify(users)));
            // console.log('Filtered User List: ' + filteredUsers);
            res.status(201).send(filteredUsers);
        });
    } else {
        res.status(400).send({err: "You are not authorized to view all users"});
    }
};

exports.createUser = function(req, res) {
    // console.log("Creating user...");
    // console.log("Request Body: " + req.body);
    if(!req.body.username || !req.body.password || !req.body.email) {
        res.status(400).send({err: "Must provide username, password, and email"});
    } else {
        let newUser = new User({username: req.body.username, password: req.body.password, email: req.body.email});
        newUser.save(function (err, user) {
            if (err) {
                // console.log("Error creating user!");
                res.status(401).send(err);
            } else {
                // console.log("User created");
                // Send them a welcome email here
                res.status(201).json(user);
            }
        });
    }
};

exports.readUser = function(req, res) {
    // Check the params
    if(!req.params.userId){
        res.status(400).send({err: "You must provide a userId"});
    }
    // Check the permission on the resource
    let permission = ac.can('everyone').readAny('user');
    if(permission.granted){
        User.findById(req.params.userId, function(err, user) {
            if (err)
                res.status(401).send(err);
            res.status(201).json(user);
        });
    } else {
        res.status(401).send({err: "Unauthorized"});
    }
};

exports.updateUser = function(req, res) {
    let permission = ac.can(req.session.user.roles).updateOwn('user');
    if(permission.granted){
        User.findOneAndUpdate(req.params.userId, req.body, {new: true}, function(err, user) {
            if (err)
                res.status(401).send(err);
            res.status(201).json(user);
        });
    } else {
        res.status(400).send({err: "You are not authorized to view all users"});
    }
};

exports.deleteUser = function(req, res) {
    user.remove({
        _id: req.params.userId
    }, function(err, user) {
        if (err)
            res.status(401).send(err);
        res.status(201).json({message: 'user successfully deleted'});
    });
};

// Authorization Handler
// look up the user with the jwt token and push the users role list
// onto the request for authorization at the endpoint
exports.ensureAuthorized = function(req, res, next) {
    // console.log('ensureAuthorized...');
    let bearerToken;
    let bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        // console.log("Sent Token: " + bearerToken);
        // use the token to look up the user
        User.findOne({token: bearerToken}, function(err, user) {
            if (err || user === null){
                // console.log('Token lookup failed...');
                res.status(401).send({err: "Invalid Token - Error: " + err});
            } else {
                // User was found with the token
                // console.log(user);
                req.user = user;
                // console.log('Valid Token - Authorized');
                next();
            }
        });
    } else {
        res.status(403).send({err: "Provide Token"});
    }
}