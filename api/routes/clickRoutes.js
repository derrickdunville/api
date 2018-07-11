'use strict';
module.exports = function(app) {
    let clickController = require('../controllers/clickController'),
        config  = require('../config')

    // Stripe Webhook Route
    app.route('/clicks')
      /**
       * @api {get} /users List All Clicks
       * @apiGroup User
       * @apiSuccess {JSON} List of all clicks
       * @apiError Unauthorized user is unauthorized
       */
      .get(clickController.listClicks)
      
      /**
       * @api {post} /click Create a new referral click
       * @apiGroup Click
       * @apiSuccess {Status} 201 - created
       * @apiError
       */
      .post(clickController.createClick)
};
