/**
 * NSServerController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var AD = require('ad-utils');

module.exports = {


  /**
   * Action blueprints:
   *    `/nsserver/ping`
   */
  ping: function (req, res) {

      AD.log();
      AD.log('<green><bold>---------------------</bold></green>');
      AD.log('Ping ...');
      AD.log('from ip addr: '+req.connection.remoteAddress);
      AD.log();
      AD.log('cas baseuri:'+ CAS.baseURI());

    // Send a JSON response
    return res.json({
      status: 'pong',
      "CAS": {
          uri:CAS.baseURI(),
          authURI:sails.config.appdev.authURI
      }
    });
  },


  /**
   * Action blueprints:
   *    `/nsserver/auth`
   */
  auth: function (req, res) {

      AD.log();
      AD.log('<green><bold>---------------------</bold></green>');
      AD.log('<green><bold>/nsserver/auth ...</bold></green>');
      AD.log('from ip addr: '+req.connection.remoteAddress);

      ADCore.comm.success(res, {});
  },


  /**
   * Action blueprints:
   *    `/nsserver/sync`
   */
  sync: function (req, res) {

      var log = req.appdev.transactionLog;
      var lastSyncTimestamp = Date.now();

      AD.log();
      AD.log('<green><bold>SYNC:</bold></green><yellow><bold>Complete!</bold></yellow>');
      AD.log(' ==> lastSyncTimestamp:'+lastSyncTimestamp);

      ADCore.comm.success(res, {
          "lastSyncTimestamp": lastSyncTimestamp,
          "transactionLog":log
        });

  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to NSServerController)
   */
  _config: {}


};
