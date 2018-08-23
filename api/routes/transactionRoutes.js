'use strict';
module.exports = function(app) {

    let authService = require('../helpers/authService'),
        transactionController  = require('../controllers/transactionController'),
        config                = require('../config')

    // transactions Routes
    app.route('/transactions')
        /**
         * @api {get} /transactions List All Transactions
         * @apiGroup Transaction
         * @apiSuccess {JSON} List of all transactions
         * @apiError Unauthorized user is unauthorized
         */
        //.get(transactionController.ensureAuthorized, transactionController.listTransactions)
        .get(transactionController.listTransactions)

        /**
         * @api {post} /transactions Create New Transaction
         * @apiGroup Transaction
         * @apiParam {JSON} transaction json object
         * @apiSuccess {JSON} Transactions object
         * @apiError Unauthorized user is unauthorized
         */
        .post(authService.ensureAuthorized, transactionController.createTransaction)

    app.route('/transactions/:transactionId')
        /**
         * @api {get} /transactions/:transactionId Read Transaction
         * @apiGroup Transaction
         * @apiParam {Integer} transactionId Id of the desired transaction
         * @apiSuccess {JSON} Transaction Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(transactionController.readTransaction)
        /**
         * @api {put} /transactions/:transactionId Update Transaction
         * @apiGroup Transaction
         * @apiParam {Integer} transactionId Id of the desired transaction
         * @apiSuccess {JSON} Transaction Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(transactionController.updateTransaction)
        /**
         * @api {delete} /transactions/:transactionId Delete Transaction
         * @apiGroup Transaction
         * @apiParam {Integer} transactionId Id of the desired transaction
         * @apiSuccess {JSON} Transaction Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(transactionController.deleteTransaction);

};
