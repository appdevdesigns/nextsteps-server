/**
 * NSServerTransactionLog
 *
 * @module      :: Model NSServerTransactionLog
 * @description :: List of transactions.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    connection: ['nextStepsServer'],

    tableName: 'nextsteps_transaction_log',

    attributes: {

        user_uuid	: 'STRING',

//  NOTE: We use updatedAt field rather than a timestamp.
//      timestamp	: 'DATETIME',
// 
        transaction	: 'JSON'
        
    },

    //  Retrieve a list of transactions for a given user after a specified timestamp.
    getLogForUser : function(userId, timestamp, cb) {
                
        if ( (undefined == userId) || (undefined == timestamp) ) {
            var err = new Error('Error: NSServerTransactionLog::getLogForUser - Invalid parameter');
            cb(err);
            return;
        }
        if ( undefined == cb ) {
            console.log('Error: NSServerTransactionLog::getLogForUser - no callback provided')
            return;
        }
        NSServerTransactionLog.find({user_uuid:userId}).where({updatedAt:{'>=':timestamp}})
        .then(function (logObjs){
            var userLog = []; // returned list of transactions for a user.
            for (var t = 0; t < logObjs.length; t++) {
                userLog.push(logObjs[t].transaction);
            }
            cb(null, userLog);
        })
        .fail(function(err){
            cb(err);
        });            
    }


};
