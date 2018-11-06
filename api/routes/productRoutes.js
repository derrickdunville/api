'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        productController  = require('../controllers/productController'),
        config = require('../config'),
        multer = require('multer'),
        upload = multer()

    // products Routes
    app.route('/products')
        /**
         * @api {get} /products List All Products
         * @apiGroup Product
         * @apiSuccess {JSON} List of all products
         * @apiError Unauthorized user is unauthorized
         */
        //.get(productController.ensureAuthorized, productController.listProducts)
        .get(authService.optionalAuthorization, productController.listProducts)

        /**
         * @api {post} /products Create New Product
         * @apiGroup Product
         * @apiParam {JSON} product json object
         * @apiSuccess {JSON} Products object
         * @apiError Unauthorized user is unauthorized
         */
        //.post(authService.ensureAuthorized, upload.fields([{name: 'cover_image', maxCount: 1}, {name: 'uploaded_file', maxCount: 1}]), productController.createProduct)
        .post(authService.ensureAuthorized,
          upload.fields([{
            name: 'cover_image', maxCount: 1
          },{
            name: 'uploaded_file', maxCount: 1
          }]),
          productController.createProduct)

    app.route('/products/:productId')
        /**
         * @api {get} /products/:productId Read Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(authService.optionalAuthorization, productController.readProduct)
        /**
         * @api {put} /products/:productId Update Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
         .put(authService.ensureAuthorized,
           upload.fields([{
             name: 'cover_image', maxCount: 1
           },{
             name: 'uploaded_file', maxCount: 1
           }]),
           productController.updateProduct)
        /**
         * @api {delete} /products/:productId Delete Product
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .delete(authService.ensureAuthorized, productController.deleteProduct);
    
    app.route('/products/:productId/download')
        /**
         * @api {get} /products/:productId/download download a products attached file
         * @apiGroup Product
         * @apiParam {Integer} productId Id of the desired product
         * @apiSuccess {JSON} Product Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(authService.ensureAuthorized, productController.downloadProduct)

};
