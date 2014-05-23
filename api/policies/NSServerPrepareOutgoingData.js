/**
 * NSServerPrepareOutgoingData
 *
 * @module      :: Policy
 * @description :: Prepare the response data for a client sync.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

var AD = require('ad-utils');

////Request format:
//{
//    "lastSyncTimestamp": 1234567890,
//    "appVersion": "1.5.0",
//    "transactionLog": [{
//        "operation": "create",
//        "model:": "Campus",
//        "params": {
//            "uuid": "01234567890abcdef",
//            "language_code": "en",
//            "name": "UAH"
//        }
//    }]
//}
//Response format:
//{
//    "status": success
//    "data": {
//        "lastSyncTimestamp": 1234567890,
//        "transactionLog": [{
//            "operation": "create",
//            "model:": "Campus",
//            "params": {
//                "uuid": "01234567890abcdef",
//                "language_code": "en",
//                "name": "UAH"
//            }
//        }]
//    }
//}

module.exports = function(req, res, next) {

    AD.log('<green><bold>preparing outgoing data ...</bold></green>');
    var lastTime = new Date(parseInt(req.param('lastSyncTimestamp'), 10));
    var userId = req.appdev.userUUID;

    AD.log('<green>  - userId[<bold>'+userId+'</bold>]</green>');
    AD.log('<green>  - lastTime[<yellow><bold>'+req.param('lastSyncTimestamp')+'</bold></yellow>] -> DateTime['+lastTime+'] </green>');

    NSServerTransactionLog.getLogForUser(userId, lastTime, function(err, data){
        if (err) {
            // exit policy chain w/o calling next();
            ADCore.comm.error(res, 'Failed to obtain transaction log, ' + err);
        }
        else {
            AD.log('  - client transactions:');
//            console.log(data);
            req.appdev.transactionLog = data;
            next();
        }
    });


};
