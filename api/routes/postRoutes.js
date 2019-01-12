'use strict';
module.exports = function(app) {
    let authService = require('../helpers/authService'),
        postController = require('../controllers/postController'),
        config  = require('../config'),
        multer    = require('multer'),
        upload    = multer()


    app.route('/posts')
        /**
         * @api {get} /posts List All Posts
         * @apiGroup Post
         * @apiSuccess {JSON} List of all posts
         * @apiError Unauthorized post is unauthorized
         */
        .get(authService.ensureAuthorized, postController.listPosts)

        /**
         * @api {post} /posts Create New Post
         * @apiGroup Post
         * @apiParam {JSON} post json object
         * @apiSuccess {JSON} List of all posts
         * @apiError Unauthorized post is unauthorized
         */
        .post(authService.ensureAuthorized, postController.createPost);

    app.route('/posts/:id')
        /**
         * @api {get} /posts/:postname Read Post
         * @apiGroup Post
         * @apiParam {Integer} postId Id of the desired post
         * @apiSuccess {JSON} Post Object
         * @apiError Unauthorized post is unauthorized
         */
        .get(authService.ensureAuthorized, postController.readPost)
        /**
         * @api {put} /posts/:postId Update Post
         * @apiGroup Post
         * @apiParam {Integer} postId Id of the desired post
         * @apiSuccess {JSON} Post Object
         * @apiError Unauthorized post is unauthorized
         */
        .put(authService.ensureAuthorized, postController.updatePost)
        /**
         * @api {delete} /posts/:postId Delete Post
         * @apiGroup Post
         * @apiParam {Integer} postId Id of the desired post
         * @apiSuccess {JSON} Post Object
         * @apiError Unauthorized post is unauthorized
         */
        .delete(authService.ensureAuthorized, postController.deletePost);

};
