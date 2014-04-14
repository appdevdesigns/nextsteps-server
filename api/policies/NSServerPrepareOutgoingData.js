/**
 * NSServerPrepareOutgoingData
 *
 * @module      :: Policy
 * @description :: Prepare the response data for a client sync.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

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

    console.log('preparing outgoing data ...');
    var lastTime = new Date(parseInt(req.param('lastSyncTimestamp'), 10));
    var userId = req.appdev.userUUID;

    console.log('  - userId['+userId+']');
    console.log('  - lastTime['+req.param('lastSyncTimestamp')+'] -> DateTime['+lastTime+']');

    NSServerTransactionLog.getLogForUser(userId, lastTime, function(err, data){
        if (err) {
            // exit policy chain w/o calling next();
            ADCore.comm.error(res, 'Failed to obtain transaction log, ' + err);
        }
        else {
            console.log('  - client transactions:');
//            console.log(data);
            req.appdev.transactionLog = data;
            next();
        }
    });


};
