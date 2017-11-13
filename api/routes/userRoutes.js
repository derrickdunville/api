'use strict';
module.exports = function(app) {
    let userController = require('../controllers/userController'),
        config  = require('../config')

    // users Routes
    app.route('/users')
        /**
         * @api {get} /users List All Users
         * @apiGroup User
         *
         * @apiSuccess {JSON} List of all users
         *
         * @apiError Unauthorized user is unauthorized
         */
        .get(userController.ensureAuthorized, userController.listUsers)

        /**
         * @api {post} /users Create New User
         * @apiGroup User
         * @apiParam {JSON} user json object
         * @apiSuccess {JSON} List of all users
         *
         * @apiError Unauthorized user is unauthorized
         */
        .post(userController.createUser);

    app.route('/users/:userId')
        /**
         * @api {get} /users/:userId Read User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         *
         * @apiError Unauthorized user is unauthorized
         */
        .get(userController.readUser)
        /**
         * @api {put} /users/:userId Update User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         *
         * @apiError Unauthorized user is unauthorized
         */
        .put(userController.updateUser)
        /**
         * @api {delete} /users/:userId Delete User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         *
         * @apiError Unauthorized user is unauthorized
         */
        .delete(userController.deleteUser);

    app.route('/login')
        /**
         * @api {post} /login Login
         * @apiGroup Auth
         * @apiParam {JSON} User, example: { username: "AscendUser", password: "password"}
         *
         * @apiSuccess {JSON} User Object
         *
         * @apiError Unauthorized user is unauthorized
         */
        .post(userController.loginUser);

};
