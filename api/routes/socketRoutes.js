'use strict';
module.exports = function(app) {
    let socketController = require('../controllers/socketController'),
        config  = require('../config')

    // Stripe Webhook Route
    app.route('/socket')
        /**
         * @api {post} /oauth/discord/state Generate a discord oauth state token
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .get(socketController.testing);
};
