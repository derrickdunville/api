'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        meController = require('../controllers/meController'),
        config  = require('../config'),
        multer    = require('multer'),
        upload    = multer()

    app.route('/@me')
      /**
       * @api {get} /@me
       * @apiGroup @me
       * @apiSuccess {JSON} User me
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.me)
    app.route('/@me/discord_roles')
      /**
       * @api {get} /@me/discord_roles
       * @apiGroup @me
       * @apiSuccess {JSON} User me
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myDiscordRoles)
    app.route('/@me/payment_method')
      /**
       * @api {post} /@me/payment_method
       * @apiGroup @me
       * @apiSuccess {JSON} User me
       * @apiError Unauthorized user is unauthorized
       */
      .put(authService.ensureAuthorized, meController.updateMyPaymentMethod)
      /**
       * @api {get} /@me/payment_method
       * @apiGroup @me
       * @apiSuccess {JSON} User me
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myPaymentMethod)

    app.route('/@me/referrals')
      /**
       * @api {get} /@me/referrals
       * @apiGroup @me
       * @apiSuccess {JSON} List users I have referred
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myReferrals)
    app.route('/@me/referrals/account')
      /**
       * @api {post} /@me/referrals/account
       * @apiGroup @me
       * @apiSuccess {JSON} Create my referral account
       * @apiError Unauthorized user is unauthorized
       */
      .post(authService.ensureAuthorized, meController.createReferralAccount)
      /**
       * @api {get} /@me/referrals/account
       * @apiGroup @me
       * @apiSuccess {JSON} Register my referral account
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myReferralAccount)
      /**
       * @api {put} /@me/referrals/account
       * @apiGroup @me
       * @apiSuccess {JSON} Update my referral account details
       * @apiError Unauthorized user is unauthorized
       */
      .put(authService.ensureAuthorized, upload.fields([{name: 'identity_document_front', maxCount: 1}, {name: 'identity_document_back', maxCount: 1}]), meController.updateReferralAccount)
      /**
       * @api {delete} /@me/referrals/account
       * @apiGroup @me
       * @apiSuccess {JSON} Update my referral account details
       * @apiError Unauthorized user is unauthorized
       */
      // .delete(authService.ensureAuthorized, meController.myReferrals)
    app.route('/@me/referrals/account/bank_account')
      /**
       * @api {put} /@me/referrals/account/bank_account
       * @apiGroup @me
       * @apiSuccess {JSON} Update my bank account
       * @apiError Unauthorized user is unauthorized
       */
      .put(authService.ensureAuthorized, meController.updateBankAccount)
    app.route('/@me/referrals/account/balance')
      /**
       * @api {get} /@me/referrals/account
       * @apiGroup @me
       * @apiSuccess {JSON} Register my referral account
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myReferralAccountBalance)
    app.route('/@me/clicks')
      /**
       * @api {get} /@me/clicks
       * @apiGroup @me
       * @apiSuccess {JSON} List of click I have referred
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myClicks)
    app.route('/@me/commissions')
      /**
       * @api {get} /@me/commissions
       * @apiGroup @me
       * @apiSuccess {JSON} List of commissions I have recieved from referrals
       * @apiError Unauthorized user is unauthorized
       */
      .get(authService.ensureAuthorized, meController.myCommissions)

};
