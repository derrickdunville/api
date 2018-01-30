'use strict';
module.exports = function(app) {

    let productController  = require('../controllers/productController'),
        config                = require('../config')

    // products Routes
    app.route('/products')
        /**
         * @api {get} /products List All Products
         * @apiGroup Product
         * @apiSuccess {JSON} List of all products
         * @apiError Unauthorized user is unauthorized
         */
        //.get(productController.ensureAuthorized, productController.listProducts)
        .get(productController.listProducts)

        /**
         * @api {post} /products Create New Product
         * @apiGroup Product
         * @apiParam {JSON} product json object
         * @apiSuccess {JSON} Products object
         * @apiError Unauthorized user is unauthorized
         */
        .post(productController.createProduct)

    app.route('/products/:productId')
        /**
         * @api {get} /products/:productId Read Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(productController.readProduct)
        /**
         * @api {put} /products/:productId Update Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .put(productController.updateProduct)
        /**
         * @api {delete} /products/:productId Delete Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(productController.deleteProduct);

};
