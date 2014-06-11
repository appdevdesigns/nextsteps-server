/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {

    'get /nsserver/ping':'nextsteps-server/NSServerController.ping',
//    'get /nsserver/auth':'nextsteps-server/NSServerController.auth',    // useful for testing with a browser
//    'get /nsserver/sync':'nextsteps-server/NSServerController.sync',    // useful for testing with a browser
    'post /nsserver/auth':'nextsteps-server/NSServerController.auth',
    'post /nsserver/sync':'nextsteps-server/NSServerController.sync',

};

