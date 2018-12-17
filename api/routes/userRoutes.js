'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        userController = require('../controllers/userController'),
        config  = require('../config'),
        multer    = require('multer'),
        upload    = multer()


    app.route('/users')
        /**
         * @api {get} /users List All Users
         * @apiGroup User
         * @apiSuccess {JSON} List of all users
         * @apiError Unauthorized user is unauthorized
         */
        .get(authService.ensureAuthorized, userController.listUsers)

        /**
         * @api {post} /users Create New User
         * @apiGroup User
         * @apiParam {JSON} user json object
         * @apiSuccess {JSON} List of all users
         * @apiError Unauthorized user is unauthorized
         */
        .post(userController.createUser);

    app.route('/users/:userId')
        /**
         * @api {get} /users/:username Read User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(authService.ensureAuthorized, userController.readUser)
        /**
         * @api {put} /users/:userId Update User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(authService.ensureAuthorized, userController.updateUser)
        /**
         * @api {delete} /users/:userId Delete User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(authService.ensureAuthorized, userController.deleteUser);

    app.route('/login')
        /**
         * @api {post} /login Login
         * @apiGroup Auth
         * @apiParam {JSON} User, example: { username: "AscendUser", password: "password"}
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .post(userController.loginUser);

    app.route('/logout')
        /**
         * @api {post} /logout Logout
         * @apiGroup Auth
         * @apiParam {JSON} User, example: { username: "AscendUser", password: "password"}
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(authService.ensureAuthorized, userController.logoutUser);

    app.route('/@me')
      /**
       * @api {get} /@me Get the currently logged in user
       * @apiGroup User
       * @apiSuccess {JSON} User Object
       * @apiError Unauthorized user is unauthorized
       */
        .get(authService.ensureAuthorized, userController.me)
};
