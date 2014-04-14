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

module.exports = {


  /**
   * Action blueprints:
   *    `/nsserver/ping`
   */
  ping: function (req, res) {

      console.log('---------------------');
      console.log('Ping ...');
      console.log('from ip addr: '+req.connection.remoteAddress);
      console.log();
      console.log('cas baseuri:'+ CAS.baseURI());

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
      // TODO: for testing: these are valid users:
//      var validUsers = {
//              'jon@vellacott.co.uk':'manila',
//              'lucia4070@nate.com':'manila'
//      }
//      var user = req.param('username');
//      var pword = req.param('password');

      console.log('---------------------');
      console.log('/nsserver/auth ...');
      console.log('from ip addr: '+req.connection.remoteAddress);

//      if (validUsers[user] == pword) {
//          console.log('  -> auth success.');
//          console.log();
//          // Send a JSON response
//          return ADCore.comm.success(res, {});
//
//      } else {
//          console.log('  -> auth failure.');
//          console.log('  -> username:'+user);
//          console.log('  -> password:'+pword);
//          console.log();
//          var err = new Error('Invalid Username or password ');
//          return ADCore.comm.error(res, err);
//      }

      ADCore.comm.success(res, {});
  },


  /**
   * Action blueprints:
   *    `/nsserver/sync`
   */
  sync: function (req, res) {

      var log = req.appdev.transactionLog;
      var lastSyncTimestamp = Date.now();
      console.log(' ==> lastSyncTimestamp:'+lastSyncTimestamp)
      ADCore.comm.success(res, {
          "lastSyncTimestamp": lastSyncTimestamp,
          "transactionLog":log
        });

/*
    NSServerSync.synchronize(req, res)
    .done(function(data) {
      ADCore.comm.success(res, data);
    })
    .fail(function(err){
      ADCore.comm.error(res, err);
    });
*/
  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to NSServerController)
   */
  _config: {}


};
