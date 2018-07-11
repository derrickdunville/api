'use strict';
module.exports = function(app) {
    let validationController = require('../controllers/validationController'),
        config  = require('../config')
    // users Routes
    app.route('/validation/username/:username')

        /**
         * @api {get} /users Validates a Username
         * @apiGroup Validation
         * @apiParam {JSON} { username: AscendUser }
         * @apiSuccess {JSON} { valid: boolean }
         */
        .get(validationController.validateUsername);

};
