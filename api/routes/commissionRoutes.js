'use strict';
module.exports = function(app) {
    let commissionController  = require('../controllers/commissionController'),
        config                = require('../config')

    // commissions Routes
    app.route('/commissions')
        /**
         * @api {get} /commissions List All Commissions
         * @apiGroup Commission
         * @apiSuccess {JSON} List of all commissions
         * @apiError Unauthorized user is unauthorized
         */
        //.get(commissionController.ensureAuthorized, commissionController.listCommissions)
        .get(commissionController.listCommissions)

        /**
         * @api {post} /commissions Create New Commission
         * @apiGroup Commission
         * @apiParam {JSON} commission json object
         * @apiSuccess {JSON} Commissions object
         * @apiError Unauthorized user is unauthorized
         */
        .post(commissionController.createCommission)

    app.route('/commissions/:commissionId')
        /**
         * @api {get} /commissions/:commissionId Read Commission
         * @apiGroup Commission
         * @apiParam {Integer} commissionId Id of the desired commission
         * @apiSuccess {JSON} Commission Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(commissionController.readCommission)
        /**
         * @api {put} /commissions/:commissionId Update Commission
         * @apiGroup Commission
         * @apiParam {Integer} commissionId Id of the desired commission
         * @apiSuccess {JSON} Commission Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(commissionController.updateCommission)
        /**
         * @api {delete} /commissions/:commissionId Delete Commission
         * @apiGroup Commission
         * @apiParam {Integer} commissionId Id of the desired commission
         * @apiSuccess {JSON} Commission Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(commissionController.deleteCommission);

};
