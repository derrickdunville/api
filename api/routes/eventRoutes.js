'use strict';
module.exports = function(app) {

    let eventController  = require('../controllers/eventController'),
        config                = require('../config')

    // events Routes
    app.route('/events')
        /**
         * @api {get} /events List All Events
         * @apiGroup Event
         * @apiSuccess {JSON} List of all events
         * @apiError Unauthorized user is unauthorized
         */
        //.get(eventController.ensureAuthorized, eventController.listEvents)
        .get(eventController.listEvents)

    app.route('/events/:eventId')
        /**
         * @api {get} /events/:eventId Read Event
         * @apiGroup Event
         * @apiParam {Integer} eventId Id of the desired event
         * @apiSuccess {JSON} Event Object
         * @apiError Unauthorized user is unauthorized
         */
        .get(eventController.readEvent)
};
