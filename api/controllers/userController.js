'use strict';
var mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    config  = require('../config'),
    _       = require('lodash'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    User    = mongoose.model('Users'),
    AccessControl      = require('accesscontrol');

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

var grants = {
    admin: {
        user: {
            "read:any": ["*"],
            "delete:any": ["*"],
            "update:any": ["*"]
        }
    },
    everyone: {
        user: {
            "read:any": ['*', '!password'],
            "delete:own": ['*'],
            "update:own": ['*']
        }
    }
};

var ac = new AccessControl(grants);

var jwtCheck = ejwt({
    secret: config.secretKey
});

function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), config.secretKey, { expiresIn: 60*60*5 });
}

function checkSession(req){
    if(req.session && req.session.user){
        return true;
    }
    return false;
}
exports.loginUser = function(req, res){
    if (!req.body.username || !req.body.password) {
        res.status(400).send("You must provide the username and password");
    } else {
        //lookup user by username
        //password should come hashed from the client application
        User.findOne({username: req.body.username}, function(err, user) {
            if (err){
                res.status(401).send(err);
            } else {
                if(user.password !== req.body.password){
                    res.status(400).send("username and password does not match");
                } else {
                    req.session.user = user;
                    var token = {
                        id_token: createToken(user),
                        user: user
                    };
                    res.status(201).send(token);
                }
            }
        });
    }
};

exports.listUsers = function(req, res) {
    if(checkSession(req)){
        var permission = ac.can(req.session.user.roles).readAny('user');
        if(permission.granted){
            User.find({}, function(err, users) {
                if (err)
                    res.status(401).send(err);
                console.log(users);
                console.log(permission.attributes);
                console.log(permission.filter(users));
                res.status(201).json(users);
            });
        } else {
            res.status(400).send("You are not authorized to view all users");
        }
    } else {
        res.status(400).send("Invalid session token");
    }
};

exports.createUser = function(req, res) {
    var newUser = new User(req.body);
    newUser.save(function(err, user) {
        if (err){
            res.status(401).send(err);
        } else {
            // Send them a welcome email here
            res.status(201).json(user);
        }
    });
};

exports.readUser = function(req, res) {
    // Check the params
    if(!req.params.userId){
        res.status(400).send("You must provide a userId");
    }
    // Check the permission on the resource
    var permission = ac.can('everyone').readAny('user');
    if(permission.granted){
        User.findById(req.params.userId, function(err, user) {
            if (err)
                res.status(401).send(err);
            res.status(201).json(user);
        });
    } else {
        res.status(401).send("Unauthorized");
    }

};

exports.updateUser = function(req, res) {
    if(checkSession(req)){
        var permission = ac.can(req.session.user.roles).updateOwn('user');
        if(permission.granted){
            User.findOneAndUpdate(req.params.userId, req.body, {new: true}, function(err, user) {
                if (err)
                    res.status(401).send(err);
                res.status(201).json(user);
            });
        } else {
            res.status(400).send("You are not authorized to view all users");
        }
    } else {
        res.status(400).send("Invalid session token");
    }
};

exports.deleteUser = function(req, res) {
    user.remove({
        _id: req.params.userId
    }, function(err, user) {
        if (err)
            res.status(401).send(err);
        res.status(201).json({ message: 'user successfully deleted' });
    });
};
