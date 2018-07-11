'use strict';
module.exports = function(app) {
    let stripeController = require('../controllers/stripeController'),
        config  = require('../config')

    // Stripe Webhook Route
    app.route('/stripe')
        /**
         * @api {post} /oauth/discord/state Generate a discord oauth state token
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .post(stripeController.webhook)

    // Stripe Countries utils Route
    app.route('/stripe/countries')
        /**
         * @api {post} /oauth/discord/state Generate a discord oauth state token
         * @apiGroup OAuth
         * @apiSuccess {JSON} OAuth State Token
         * @apiError Unauthorized user is unauthorized
         */
        // .get(userController.ensureAuthorized, userController.listUsers)
        .get(stripeController.getCountries)
};
