'use strict';
module.exports = function(app) {
    let validationController = require('../controllers/validationController'),
        config  = require('../config')
    app.route('/validation/username/:username')

      .get(validationController.validateUsername);

};
