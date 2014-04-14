/**
 * NSServer
 *
 * @module      :: Service
 * @description :: This is handles the sync service for NextSteps Server
 *
 */
var $ = require('jquery-deferred');

/*
var syncFormat = {
    lastSyncTimestamp:1,
    appVersion:1,
    transactionLog:1,
    username:1,
    password:1
};


var paramsCorrect = function( req, format) {

    var correct = true;
    if (typeof req.param('test') != 'undefined') {
        ADCore.auth.markAuthenticated(req, 'GUID1');
    } else {
      for (var f in format) {
          if (typeof req.param(f) == 'undefined') {
              correct = false;
              break;
          }
      }
    }
    return correct;
};

*/

var externalSystems = {};
var systemNone = {
        download:function(req, res) { var dfd = $.Deferred(); dfd.resolve({assignments:{}, measurements:{}}); return dfd; },
        upload:function(req, res) { var dfd = $.Deferred(); dfd.resolve(); return dfd; },
        validateUser:function(req, res) { console.log('**** systemNone.validateUser() not defined.'); var dfd = $.Deferred(); dfd.resolve(); return dfd; },
        test:function(){ }
};


module.exports = {

    externalSystems:function(key){

        if (typeof systemNone[key] == 'undefined') {

            console.log('*** NSServer.externalSystems() called with unknown system action ['+key+']');
            return {};

        } else {

            if (typeof externalSystems[key] == 'undefined') {
                externalSystems[key] = {
                        'none': systemNone[key],
                        'test': NSServerSystem_Test[key],
                        'GMA' : NSServerSystem_GMA[key]
                };
            }
            return externalSystems[key];

        }
    },
/*
    synchronize: function (req, res) {

        var dfd = $.Deferred();
        if (!paramsCorrect(req, syncFormat) ) {
            dfd.reject({status:"required param not defined"});
        } else {
            // read In given Data
            var userID = req.param('username');
            var password = req.param('password');

            var guid = ADCore.auth.getAuth(req);


            // validateUser
            validateUser(guid)
            .then(function(uuid){
console.log('validation done...');
                // Get transactions to send
                var lastSyncTimestamp = req.param('lastSyncTimestamp');
                getTransactionsForUser(uuid, lastSyncTimestamp)
                .then(function (logToSend){
                    var transactionLog = req.param('transactionLog');
                    applyTransactionsFromUser(uuid, transactionLog)
                    .then(function(timestamp) {
                        dfd.resolve({
                            "lastSyncTimestamp": timestamp,
                            "transactionLog": [{
                                "operation": "create",
                                "model:": "Campus",
                                "multilingual": false,
                                "params": {
                                    "uuid": "01234567890abcdef",
                                    "language_code": "en",
                                    "name": "UAH"
                                }
                            }]
                          });
                    })
                    .fail(function(err){
                        dfd.reject(err);
                    });
                })
                .fail(function(err){
                    dfd.reject(err);
                });
            })
            .fail(function(err){
                dfd.reject(err);
            });
      }

      return dfd;
    },
*/
    // These are for exposing private functions for testing only
    test: {

//        validateUser: function( guid ) {
//            return validateUser(guid);
//        },
//        setupGMA: function( username, password ) {
//            return setupGMA( username, password );
//        },
//        getAssignments: function( gma ) {
//            return getAssignments( gma );
//        }

    }
};



//var validateUser = function( guid ) {
//    var dfd = $.Deferred();
//
//    console.log('validating user ... ');
//    if (!guid) {
//        dfd.reject("Invalid GUID");
//    } else {
//        // is in User table?
//        // If not, generate UUID and insert
//        var uuid = AD.util.uuid();
//        // create uuid, guid
//        dfd.resolve(uuid);
//    }
//
//    return dfd;
//};
//
//
//
//
//
//var getTransactionsForUser = function( userUuid, lastSync ) {
//    var dfd = $.Deferred();
//    console.log('getting transactions to send ');
//    /*
//    Filter transaction log by user and last update time
//
//     */
//    dfd.resolve("log");
//
//    return dfd;
//};
//
//var applyTransactionsFromUser = function( userUuid, log ) {
//    var dfd = $.Deferred();
//    console.log('applying transactions from user ');
//    /*
//    Apply changes from the user
//    Add each entry to the transaction log
//    Return the current sync time
//     */
//    dfd.resolve("syncTime = now");
//
//    return dfd;
//};


