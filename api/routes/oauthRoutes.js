'use strict';
module.exports = function(app) {
    let oauthController = require('../controllers/oauthController'),
        config  = require('../config')

    // users Routes
    app.route('/oauth/discord/state')
        /**
         * @api {post} /oauth/discord/state Generate a discord oauth state token
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .post(oauthController.createOAuthState)

    // users Routes
    app.route('/oauth/discord/callback')
        /**
         * @api {get} /oauth/discord/callback Discord OAuth callback
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .get(oauthController.discordCallback)

    // users Routes
    app.route('/oauth/discord/revoke')
        /**
         * @api {post} /oauth/discord/state Revokes a discord oauth access token
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .post(oauthController.revokeOAuth)
};
