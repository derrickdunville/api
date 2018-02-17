'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        subscriptionController  = require('../controllers/subscriptionController'),
        config                = require('../config')

    // subscriptions Routes
    app.route('/subscriptions')
        /**
         * @api {get} /subscriptions List All Subscriptions
         * @apiGroup Subscription
         * @apiSuccess {JSON} List of all subscriptions
         * @apiError Unauthorized user is unauthorized
         */
        //.get(subscriptionController.ensureAuthorized, subscriptionController.listSubscriptions)
        .get(subscriptionController.listSubscriptions)

        /**
         * @api {post} /subscriptions Create New Subscription
         * @apiGroup Subscription
         * @apiParam {JSON} subscription json object
         * @apiSuccess {JSON} Subscriptions object
         * @apiError Unauthorized user is unauthorized
         */
        .post(authService.ensureAuthorized, subscriptionController.createSubscription)

    app.route('/subscriptions/:subscriptionId')
        /**
         * @api {get} /subscriptions/:subscriptionId Read Subscription
         * @apiGroup Subscription
         * @apiParam {Integer} subscriptionId Id of the desired subscription
         * @apiSuccess {JSON} Subscription Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(subscriptionController.readSubscription)
        /**
         * @api {put} /subscriptions/:subscriptionId Update Subscription
         * @apiGroup Subscription
         * @apiParam {Integer} subscriptionId Id of the desired subscription
         * @apiSuccess {JSON} Subscription Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(subscriptionController.updateSubscription)
        /**
         * @api {delete} /subscriptions/:subscriptionId Delete Subscription
         * @apiGroup Subscription
         * @apiParam {Integer} subscriptionId Id of the desired subscription
         * @apiSuccess {JSON} Subscription Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(subscriptionController.deleteSubscription);

};
