/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {

    'get /nsserver/ping':'nextsteps-server/NSServerController.ping',
    'get /nsserver/auth':'nextsteps-server/NSServerController.auth',
    'get /nsserver/sync':'nextsteps-server/NSServerController.sync',

};

