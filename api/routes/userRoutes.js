'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        userController = require('../controllers/userController'),
        config  = require('../config'),
        multer    = require('multer'),
        upload    = multer()

    // users Routes
    app.route('/users')
        /**
         * @api {get} /users List All Users
         * @apiGroup User
         * @apiSuccess {JSON} List of all users
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .get(userController.listUsers)

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
        .get(userController.readUser)
        /**
         * @api {put} /users/:userId Update User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(authService.ensureAuthorized, upload.single('avatar'), userController.updateUser)
        /**
         * @api {delete} /users/:userId Delete User
         * @apiGroup User
         * @apiParam {Integer} userId Id of the desired user
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(userController.deleteUser);

    app.route('/login')
        /**
         * @api {post} /login Login
         * @apiGroup Auth
         * @apiParam {JSON} User, example: { username: "AscendUser", password: "password"}
         * @apiSuccess {JSON} User Object
         * @apiError Unauthorized user is unauthorized
         */
        .post(userController.loginUser);

    app.route('/forgot-password')
        /**
         * @api {post} /forgot-password Forgot Password
         * @apiGroup Auth
         * @apiParam {JSON} Email, example: { email: "contact@ascendtrading.net"}
         * @apiSuccess {JSON} Err or Msg
         */
        .post(userController.forgotPassword);

    app.route('/reset-password')
        /**
         * @api {post} /reset-password Reset Password
         * @apiGroup Auth
         * @apiParam {JSON} Reset Password, example: { resetToken: "jaksdbauicbsjakd", newPassword: "newpassword"}
         * @apiSuccess {JSON} User Object
         */
        .post(userController.resetPassword);

    app.route('/verify-password-reset-token')
        /**
         * @api {post} /verify-password-reset-token Verify Password Reset Token
         * @apiGroup Auth
         * @apiParam {JSON} Reset Password, example: { resetToken: "jaksdbauicbsjakd", newPassword: "newpassword"}
         * @apiSuccess {JSON} Err or Msg
         */
        .post(userController.verifyPasswordResetToken);

};
